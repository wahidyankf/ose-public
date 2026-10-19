# Windows static checks on PowerShell 7.4: mingw-w64 syntax-checks Win32
# C, and the PowerShell parser checks .ps1. Ubuntu packages come from a
# fixed snapshot date. WPF and WinForms projects use the dotnet toolchain
# with -p:EnableWindowsTargeting=true instead of this image.
FROM mcr.microsoft.com/powershell:7.4-ubuntu-22.04@sha256:62300a213a9293916333df2b014cd3a8f22fb0b0b65f2bb446aaf436bcf8c868
RUN printf '%s\n' 'deb http://snapshot.ubuntu.com/ubuntu/20261017T000000Z/ jammy main universe' 'deb http://snapshot.ubuntu.com/ubuntu/20261017T000000Z/ jammy-updates main universe' 'deb http://snapshot.ubuntu.com/ubuntu/20261017T000000Z/ jammy-security main universe' > /etc/apt/sources.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends g++-mingw-w64-x86-64 \
    && rm -rf /var/lib/apt/lists/* \
    && x86_64-w64-mingw32-g++ --version \
    && pwsh -NoProfile -Command '$PSVersionTable.PSVersion.ToString()'
RUN useradd --create-home --uid 10000 harness
USER harness
