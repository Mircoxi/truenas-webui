import {
  LinkAggregationProtocol,
  NetworkInterfaceAliasType,
  NetworkInterfaceFlags,
  NetworkInterfaceType,
} from 'app/enums/network-interface.enum';

export interface BaseNetworkInterface {
  aliases: NetworkInterfaceAlias[];
  description: string;
  failover_aliases: NetworkInterfaceAlias[];
  failover_critical: boolean;
  failover_group: number;
  failover_vhid: number;
  failover_virtual_aliases: NetworkInterfaceAlias[];
  fake: boolean;
  id: string;
  ipv4_dhcp: boolean;
  ipv6_auto: boolean;
  mtu: number;
  name: string;
  options: string;
  state: NetworkInterfaceState;
  type: NetworkInterfaceType;

  // TODO: Unclear if this is type specific or an 'extra' field in response.
  disable_offload_capabilities?: boolean;
}

export interface PhysicalNetworkInterface extends BaseNetworkInterface {
  type: NetworkInterfaceType.Physical;
}

export interface BridgeNetworkInterface extends BaseNetworkInterface {
  type: NetworkInterfaceType.Bridge;
}

export interface VlanNetworkInterface extends BaseNetworkInterface {
  type: NetworkInterfaceType.Vlan;
  vlan_parent_interface: string;
  vlan_pcp: number;
  vlan_tag: number;
}

export interface LinkAggregationNetworkInterface extends BaseNetworkInterface {
  type: NetworkInterfaceType.LinkAggregation;
  lag_ports: string[];
  lag_protocol: LinkAggregationProtocol;
  disable_offload_capabilities: boolean;
}

export type NetworkInterface =
  | PhysicalNetworkInterface
  | LinkAggregationNetworkInterface
  | BridgeNetworkInterface
  | VlanNetworkInterface;

export interface NetworkInterfaceAlias {
  type: NetworkInterfaceAliasType;
  address: string;
  netmask?: number;
  broadcast?: string;
}

export interface NetworkInterfaceState {
  active_media_subtype: string;
  active_media_type: string;
  aliases: NetworkInterfaceAlias[];
  capabilities: string[]; // May be a enum: "LRO", "RXCSUM", "RXCSUM_IPV6"
  cloned: boolean;
  description: string;
  flags: NetworkInterfaceFlags[];
  link_address: string;
  link_state: string; // Probably a enum: LINK_STATE_UP
  media_options: unknown;
  media_subtype: string;
  media_type: string;
  mtu: number;
  name: string;
  nd6_flags: unknown[];
  orig_name: string;
  supported_media: unknown[];

  // TODO: Unclear if these are specific to network types or optional in response
  vrrp_config?: unknown;
  carp_config?: CarpConfig[];
  parent?: string;
  pcp?: unknown;
  tag?: number;
}

export interface CarpConfig {
  vhid: number;
  address: string;
  advbase: number;
  state: string; // Enum? "MASTER"
}
