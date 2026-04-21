export type DutyStatusCode = "OFF" | "SB" | "D" | "ON";

export interface TripPlanRequest {
  current_location: string;
  pickup_location: string;
  dropoff_location: string;
  current_cycle_used_hrs: number;
}

export interface ELDSegmentDTO {
  start_hour: number;
  end_hour: number;
  status: DutyStatusCode;
  location: string;
}

export interface DailyLogDTO {
  date: string;
  segments: ELDSegmentDTO[];
  total_driving_hrs: number;
  total_on_duty_hrs: number;
}

export interface TripStopDTO {
  type: string;
  location: string;
  lat: number | null;
  lng: number | null;
  eta_hours_from_start: number;
  detail?: string;
}

export interface TripPlanResponse {
  route_polyline: string;
  stops: TripStopDTO[];
  daily_logs: DailyLogDTO[];
  total_distance_miles: number;
  total_trip_days: number;
}

export type ApiErrorBody = { detail?: unknown };
