export interface IEndpointStatus {
  endpoint?: string;
  isOK: boolean;
  description?: string;
}

export type IEndpointsStatus = Array<IEndpointStatus>;
