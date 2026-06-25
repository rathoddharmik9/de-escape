import { createAdminClient } from "@/lib/supabase/admin";
import AuditLogsBrowser from "@/components/admin/AuditLogsBrowser";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AuditLogPage() {
  const supabase = createAdminClient();

  // 1. Fetch recent 100 audit logs
  const { data: logs, error: logsError } = await supabase
    .from("audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (logsError) {
    console.error("Failed to fetch audit logs:", logsError.message);
  }

  // 2. Fetch admins list to resolve user_id -> email mapping
  const { data: admins } = await supabase
    .from("admins")
    .select("user_id, email");

  const adminEmailMap: Record<string, string> = {};
  if (admins) {
    admins.forEach((admin) => {
      adminEmailMap[admin.user_id] = admin.email;
    });
  }

  interface DBLog {
    id: string;
    actor_id: string;
    action: string;
    target_table: string;
    target_id: string | null;
    before: Record<string, unknown> | null;
    after: Record<string, unknown> | null;
    ip: string | null;
    created_at: string;
  }

  // 3. Map logs to include actor_email
  const mappedLogs = (logs ?? []).map((log) => {
    const l = log as unknown as DBLog;
    return {
      id: l.id,
      actor_id: l.actor_id,
      actor_email: adminEmailMap[l.actor_id] || "System / Automated Action",
      action: l.action,
      target_table: l.target_table,
      target_id: l.target_id,
      before: l.before,
      after: l.after,
      ip: l.ip,
      created_at: l.created_at,
    };
  });

  return <AuditLogsBrowser initialLogs={mappedLogs} />;
}
