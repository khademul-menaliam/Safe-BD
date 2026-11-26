const STATUS_STYLES: Record<string, string> = {
  SUBMITTED: "bg-gray-100 text-gray-700",
  GD_PENDING: "bg-brand-amber/15 text-amber-700",
  UNDER_REVIEW: "bg-blue-100 text-blue-700",
  GD_VERIFIED: "bg-brand-green/15 text-green-700",
  ADDITIONAL_INFORMATION_REQUIRED: "bg-brand-amber/15 text-amber-700",
  LOCATION_ASSISTANCE_REQUESTED: "bg-navy-700/10 text-navy-700",
  LOCATION_INFORMATION_RECEIVED: "bg-brand-green/15 text-green-700",
  RESOLVED: "bg-brand-green/20 text-green-800",
  CLOSED: "bg-gray-200 text-gray-600",
  REJECTED: "bg-brand-red/15 text-red-700",
  PENDING: "bg-brand-amber/15 text-amber-700",
  VERIFIED: "bg-brand-green/15 text-green-700",
  PROCESSING: "bg-blue-100 text-blue-700",
  RECEIVED: "bg-brand-green/15 text-green-700",
  ACTIVE: "bg-brand-red/15 text-red-700", // SOSStatus.ACTIVE (urgent). Subscription "ACTIVE" is rendered separately, not via this component.
  ACKNOWLEDGED: "bg-brand-amber/15 text-amber-700",
  CANCELLED: "bg-gray-200 text-gray-600",
  EXPIRED: "bg-gray-200 text-gray-600",
  NONE: "bg-gray-100 text-gray-600",
  PAST_DUE: "bg-brand-amber/15 text-amber-700",
  SUCCEEDED: "bg-brand-green/15 text-green-700",
  FAILED: "bg-brand-red/15 text-red-700",
  REFUNDED: "bg-gray-200 text-gray-600",
};

export default function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? "bg-gray-100 text-gray-700";
  return <span className={`badge ${style}`}>{status.replaceAll("_", " ")}</span>;
}
