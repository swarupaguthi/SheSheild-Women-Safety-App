export type ReportStatus = "Pending" | "Verified" | "Forwarded" | "Resolved";

export type Language = "en" | "hi";

export interface SafetyReport {
  id: string;
  description: string;
  vehicleNumber: string | null;
  instagramAccount: string | null;
  phoneNumber: string | null;
  locationLabel: string;
  latitude: number | null;
  longitude: number | null;
  imageUri: string | null;
  anonymous: boolean;
  createdAt: string;
  status: ReportStatus;
}

export interface SosLog {
  id: string;
  startedAt: string;
  stoppedAt: string | null;
  latitude: number | null;
  longitude: number | null;
  recipients: string[];
}

export interface HelpCenter {
  id: string;
  name: string;
  kind: "Police" | "NGO";
  phone: string;
  address: string;
  latitude: number;
  longitude: number;
}
