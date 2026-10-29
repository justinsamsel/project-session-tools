<#
.SYNOPSIS
    Captures a running application's window to a PNG.

.DESCRIPTION
    Exists because Obsidian 1.13.7's built-in `dev:screenshot` CLI command
    returns exit 127 on this build (the whole `dev:*` namespace does, including
    `dev:debug`), so an agent cannot verify reading view through Obsidian
    itself. This captures the window at the OS level instead, which is
    independent of the app build.

    Tries PrintWindow with PW_RENDERFULLCONTENT first, which can capture a
    Chromium/Electron window even when partly occluded. Falls back to a
    screen-region copy if that comes back blank.

.PARAMETER Process
    Process name to capture (default: Obsidian).

.PARAMETER Out
    Output PNG path (required).

.PARAMETER TitleExclude
    Regex of window titles to skip. Obsidian's Settings dialog is a separate
    top-level window and will otherwise be captured instead of the note.

.EXAMPLE
    .\Capture-Window.ps1 -Out C:\Temp\obsidian.png
#>

[CmdletBinding()]
param(
    [string]$Process = "Obsidian",
    [Parameter(Mandatory = $true)][string]$Out,
    [string]$TitleExclude = '^Settings'
)

Add-Type -AssemblyName System.Drawing

Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public class WinCap {
    [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
    [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);
    [DllImport("user32.dll")] public static extern bool PrintWindow(IntPtr hWnd, IntPtr hdcBlt, uint nFlags);
    [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
    [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr hWnd);
    [DllImport("user32.dll", CharSet = CharSet.Unicode)]
    public static extern int GetWindowText(IntPtr hWnd, System.Text.StringBuilder s, int max);
    [DllImport("user32.dll")] public static extern int GetWindowThreadProcessId(IntPtr hWnd, out int pid);
    public delegate bool EnumProc(IntPtr hWnd, IntPtr lParam);
    [DllImport("user32.dll")] public static extern bool EnumWindows(EnumProc cb, IntPtr lParam);
    [StructLayout(LayoutKind.Sequential)]
    public struct RECT { public int Left, Top, Right, Bottom; }

    public static System.Collections.Generic.List<IntPtr> TopLevel(int pid) {
        var found = new System.Collections.Generic.List<IntPtr>();
        EnumWindows((h, l) => {
            int p; GetWindowThreadProcessId(h, out p);
            if (p == pid && IsWindowVisible(h)) found.Add(h);
            return true;
        }, IntPtr.Zero);
        return found;
    }

    public static string TitleOf(IntPtr h) {
        var sb = new System.Text.StringBuilder(512);
        GetWindowText(h, sb, sb.Capacity);
        return sb.ToString();
    }
}
'@

# Match the physical pixels GetWindowRect reports on a scaled display.
try { [WinCap]::SetProcessDPIAware() | Out-Null } catch {}

$procs = @(Get-Process -Name $Process -ErrorAction SilentlyContinue)
if (-not $procs) { Write-Error "$Process is not running."; exit 1 }

# Electron apps own several top-level windows (Obsidian's Settings dialog is
# one). Pick the largest window whose title isn't excluded, so a modal doesn't
# get captured in place of the note.
$cands = foreach ($p in $procs) {
    foreach ($h in [WinCap]::TopLevel($p.Id)) {
        $t = [WinCap]::TitleOf($h)
        if ([string]::IsNullOrWhiteSpace($t)) { continue }
        if ($TitleExclude -and $t -match $TitleExclude) { continue }
        $r = New-Object WinCap+RECT
        [WinCap]::GetWindowRect($h, [ref]$r) | Out-Null
        [pscustomobject]@{ H = $h; Title = $t; Area = ($r.Right - $r.Left) * ($r.Bottom - $r.Top) }
    }
}
$pick = $cands | Sort-Object Area -Descending | Select-Object -First 1
if (-not $pick) { Write-Error "No matching $Process window (all excluded by '$TitleExclude')."; exit 1 }
$hwnd = $pick.H
if ([WinCap]::IsIconic($hwnd)) { [WinCap]::ShowWindow($hwnd, 9) | Out-Null }  # SW_RESTORE
[WinCap]::SetForegroundWindow($hwnd) | Out-Null
Start-Sleep -Milliseconds 600   # let the window paint after focus

$rect = New-Object WinCap+RECT
if (-not [WinCap]::GetWindowRect($hwnd, [ref]$rect)) { Write-Error "GetWindowRect failed."; exit 1 }
$w = $rect.Right - $rect.Left
$h = $rect.Bottom - $rect.Top
if ($w -le 0 -or $h -le 0) { Write-Error "Bad window rect ${w}x${h}."; exit 1 }

function Test-Blank([System.Drawing.Bitmap]$bmp) {
    # Sample a grid; a capture that failed comes back uniformly black.
    $seen = @{}
    for ($x = 5; $x -lt $bmp.Width; $x += [Math]::Max(40, [int]($bmp.Width / 12))) {
        for ($y = 5; $y -lt $bmp.Height; $y += [Math]::Max(40, [int]($bmp.Height / 12))) {
            $seen[$bmp.GetPixel($x, $y).ToArgb()] = $true
            if ($seen.Count -gt 3) { return $false }
        }
    }
    return $true
}

$bmp = New-Object System.Drawing.Bitmap $w, $h
$gfx = [System.Drawing.Graphics]::FromImage($bmp)
$hdc = $gfx.GetHdc()
$ok = [WinCap]::PrintWindow($hwnd, $hdc, 2)   # PW_RENDERFULLCONTENT
$gfx.ReleaseHdc($hdc)
$gfx.Dispose()

$method = "PrintWindow"
if (-not $ok -or (Test-Blank $bmp)) {
    $bmp.Dispose()
    $bmp = New-Object System.Drawing.Bitmap $w, $h
    $gfx = [System.Drawing.Graphics]::FromImage($bmp)
    $gfx.CopyFromScreen($rect.Left, $rect.Top, 0, 0, $bmp.Size)
    $gfx.Dispose()
    $method = "CopyFromScreen"
}

$dir = Split-Path -Parent $Out
if ($dir -and -not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
$bmp.Save($Out, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()

[pscustomobject]@{
    Path = $Out; Width = $w; Height = $h; Method = $method; Window = $pick.Title
} | Format-List
