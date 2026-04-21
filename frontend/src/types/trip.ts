export type DutyStatusCode = "OFF" | "SB" | "D" | "ON";

/** Submitted with POST /api/trips/plan/ — echoed in `sheet_inputs` on the response. */
export interface TripPlanRequest {
  current_location: string;
  pickup_location: string;
  dropoff_location: string;
  current_cycle_used_hrs: number;
  /** Basic — required (matches paper “truck/tractor”). */
  truck_number: string;
  /** Advanced — optional */
  trailer_number?: string;
  trailer_number_2?: string;
  carrier_name?: string;
  carrier_main_office?: string;
  carrier_home_terminal?: string;
  total_miles_driving_today?: number | null;
  total_mileage_today?: number | null;
  shipping_manifest?: string;
  shipper_commodity?: string;
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
  sheet_inputs: TripSheetInputsDTO;
}

/** Echoed from API — same shape as request fields for log rendering */
export interface TripSheetInputsDTO {
  current_location: string;
  pickup_location: string;
  dropoff_location: string;
  current_cycle_used_hrs: number;
  truck_number: string;
  trailer_number?: string | null;
  trailer_number_2?: string | null;
  carrier_name?: string | null;
  carrier_main_office?: string | null;
  carrier_home_terminal?: string | null;
  total_miles_driving_today?: number | null;
  total_mileage_today?: number | null;
  shipping_manifest?: string | null;
  shipper_commodity?: string | null;
}

export type ApiErrorBody = { detail?: unknown };
