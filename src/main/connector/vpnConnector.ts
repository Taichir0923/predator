import { InvocationResult, PowerShell } from 'node-powershell';
import { Vpn } from 'renderer/types/Vpn';

export const connectVpn = async (res: Vpn): Promise<InvocationResult[]> => {
  const vpn = res;

  const ps = new PowerShell({
    debug: true,
    executableOptions: {
      '-ExecutionPolicy': 'Bypass',
      '-NoProfile': true,
    },
  });

  try {
    const simpleCommand = PowerShell.command`
      $vpnName = ${vpn.vpnName}
      $vpnAddress = ${vpn.vpnAddress}
      $vpnUsername = ${vpn.vpnUsername}
      $vpnPassword = ${vpn.vpnPassword}

      $vpn = Get-VpnConnection | where {$_.Name -eq $vpnName}

      if ($vpn -eq $null)
      {
        Add-VpnConnection -Name $vpnName -ServerAddress $vpnAddress
      }

      $cmd = $env:WINDIR + "/System32/rasdial.exe"
      $expression = "$cmd ""$vpnName"" $vpnUsername $vpnPassword"
      Invoke-Expression -Command $expression
    `;

    await ps.invoke(simpleCommand);
  } catch (e) {
    console.log(e);
  } finally {
    await ps.dispose();
  }

  return ps.history;
};

export const disconnectVpn = async (res: Vpn): Promise<InvocationResult[]> => {
  const vpn: Vpn = res;

  const ps = new PowerShell({
    debug: true,
    executableOptions: {
      '-ExecutionPolicy': 'Bypass',
      '-NoProfile': true,
    },
  });

  try {
    const simpleCommand = PowerShell.command`
      $vpnName = ${vpn.vpnName}

      $vpn = Get-VpnConnection -Name $vpnName;

      if($vpn.ConnectionStatus -eq "Connected"){
        rasdial $vpnName /DISCONNECT;
      } else {
        rasdial /DISCONNECT;
      }
    `;

    await ps.invoke(simpleCommand);
  } catch (e) {
    console.error(e);
  } finally {
    await ps.dispose();
  }

  return ps.history;
};
