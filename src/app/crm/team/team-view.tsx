"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  BuildingOffice2Icon,
  CheckCircleIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  LockClosedIcon,
  PlusIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  UserPlusIcon,
} from "@heroicons/react/24/outline";

export type TeamRole = "admin" | "staff";
export type TeamTab = "staff" | "clients" | "agencies";

export interface TeamCurrentUser {
  user_id: string;
  email: string;
  role: TeamRole;
  agency_id: string;
  agency_name: string;
  agency_slug: string;
  is_platform_admin: boolean;
}

export interface StaffMemberItem {
  user_id: string;
  email: string;
  role: TeamRole;
  active: boolean;
}

export interface ClientMemberItem {
  user_id: string;
  email: string;
  company_id: string;
  company_name: string;
  active: boolean;
  can_accept_proposals: boolean;
}

export interface CompanyOption {
  id: string;
  name: string;
}

export interface TeamApiResponse {
  currentUser: TeamCurrentUser;
  staff: StaffMemberItem[];
  clients: ClientMemberItem[];
  companies: CompanyOption[];
}

export interface AgencyAdminItem {
  user_id: string;
  email: string;
}

export interface AgencyItem {
  id: string;
  name: string;
  slug: string;
  intake_enabled: boolean;
  created_at: string;
  staff_count: number;
  admins: AgencyAdminItem[];
}

export interface AgenciesApiResponse {
  agencies: AgencyItem[];
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const data = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) {
    throw new Error(data.error || "Request could not be completed.");
  }
  return data;
}

function slugifyAgencyName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function formatDate(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function TeamView() {
  const [activeTab, setActiveTab] = useState<TeamTab>("staff");
  const [teamData, setTeamData] = useState<TeamApiResponse | null>(null);
  const [agencies, setAgencies] = useState<AgencyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [mutatingKey, setMutatingKey] = useState<string | null>(null);

  // Staff invite state
  const [staffEmail, setStaffEmail] = useState("");
  const [staffRole, setStaffRole] = useState<TeamRole>("staff");

  // Client portal invite state
  const [clientEmail, setClientEmail] = useState("");
  const [clientCompanyId, setClientCompanyId] = useState("");
  const [clientCanAccept, setClientCanAccept] = useState(true);

  // Platform admin agency onboarding state
  const [agencyName, setAgencyName] = useState("");
  const [agencySlug, setAgencySlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [founderEmail, setFounderEmail] = useState("");

  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const team = await requestJson<TeamApiResponse>("/api/crm/team");
      setTeamData(team);
      setClientCompanyId((prev) => {
        if (prev && team.companies.some((c) => c.id === prev)) return prev;
        return team.companies[0]?.id ?? "";
      });

      if (team.currentUser.is_platform_admin) {
        const agenciesRes = await requestJson<AgenciesApiResponse>("/api/crm/agencies");
        setAgencies(agenciesRes.agencies);
      } else {
        setAgencies([]);
        setActiveTab((prev) => (prev === "agencies" ? "staff" : prev));
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not load team and access settings.";
      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  const currentUser = teamData?.currentUser ?? null;
  const isAdmin = currentUser?.role === "admin";
  const isPlatformAdmin = Boolean(currentUser?.is_platform_admin);

  const handleInviteStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || submitting) return;
    const email = staffEmail.trim().toLowerCase();
    if (!email) return;

    setSubmitting(true);
    try {
      await requestJson("/api/crm/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "staff", email, role: staffRole }),
      });
      setStaffEmail("");
      setStaffRole("staff");
      toast.success(`Staff access granted for ${email}`);
      await loadWorkspace();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not invite staff member.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStaff = async (
    member: StaffMemberItem,
    patch: { role?: TeamRole; active?: boolean }
  ) => {
    if (!isAdmin || mutatingKey) return;
    const key = `staff:${member.user_id}`;
    setMutatingKey(key);
    try {
      await requestJson("/api/crm/team", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "staff", user_id: member.user_id, ...patch }),
      });
      toast.success(
        patch.role !== undefined
          ? `Updated ${member.email} to ${patch.role}`
          : `${member.email} ${patch.active ? "reactivated" : "deactivated"}`
      );
      await loadWorkspace();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update staff member.");
    } finally {
      setMutatingKey(null);
    }
  };

  const handleInviteClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || submitting || !clientCompanyId) return;
    const email = clientEmail.trim().toLowerCase();
    if (!email) return;

    setSubmitting(true);
    try {
      await requestJson("/api/crm/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "client",
          email,
          company_id: clientCompanyId,
          can_accept_proposals: clientCanAccept,
        }),
      });
      setClientEmail("");
      setClientCanAccept(true);
      toast.success(`Client portal access granted for ${email}`);
      await loadWorkspace();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not invite client user.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateClient = async (
    client: ClientMemberItem,
    patch: { active?: boolean; can_accept_proposals?: boolean }
  ) => {
    if (!isAdmin || mutatingKey) return;
    const key = `client:${client.user_id}:${client.company_id}`;
    setMutatingKey(key);
    try {
      await requestJson("/api/crm/team", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "client",
          user_id: client.user_id,
          company_id: client.company_id,
          ...patch,
        }),
      });
      toast.success(`Updated portal permissions for ${client.email}`);
      await loadWorkspace();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not update client portal access."
      );
    } finally {
      setMutatingKey(null);
    }
  };

  const handleCreateAgency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPlatformAdmin || submitting) return;
    const name = agencyName.trim();
    const slug = (agencySlug || slugifyAgencyName(name)).trim().toLowerCase();
    const email = founderEmail.trim().toLowerCase();
    if (!name || !slug || !email) return;

    setSubmitting(true);
    try {
      await requestJson("/api/crm/agencies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug, founder_email: email }),
      });
      setAgencyName("");
      setAgencySlug("");
      setSlugEdited(false);
      setFounderEmail("");
      toast.success(`Created agency "${name}" and invited founder ${email}`);
      await loadWorkspace();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create client agency.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleAgencyIntake = async (agency: AgencyItem) => {
    if (!isPlatformAdmin || mutatingKey) return;
    const key = `agency:${agency.id}`;
    setMutatingKey(key);
    try {
      await requestJson("/api/crm/agencies", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: agency.id, intake_enabled: !agency.intake_enabled }),
      });
      toast.success(
        `Public intake ${!agency.intake_enabled ? "enabled" : "paused"} for ${agency.name}`
      );
      await loadWorkspace();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update agency intake.");
    } finally {
      setMutatingKey(null);
    }
  };

  if (loading && !teamData) {
    return (
      <div className="p-8 rounded-3xl bg-white dark:bg-zinc-900/70 border border-gray-200 dark:border-zinc-800 text-center text-xs text-gray-500 dark:text-zinc-400">
        Loading workspace team and access controls...
      </div>
    );
  }

  if (loadError && !teamData) {
    return (
      <div className="p-8 rounded-3xl bg-white dark:bg-zinc-900/70 border border-rose-500/30 text-center space-y-3">
        <ExclamationTriangleIcon className="w-8 h-8 text-rose-500 mx-auto" />
        <h2 className="text-base font-bold text-gray-900 dark:text-white">
          Unable to load Team &amp; Access
        </h2>
        <p className="text-xs text-gray-500 dark:text-zinc-400">{loadError}</p>
        <button
          type="button"
          onClick={() => void loadWorkspace()}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-primary text-white hover:bg-primary/90 transition-colors cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!teamData || !currentUser) return null;

  const activeStaffCount = teamData.staff.filter((m) => m.active).length;
  const activeClientCount = teamData.clients.filter((c) => c.active).length;

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Header & Summary Stats */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 pb-6 border-b border-gray-200 dark:border-zinc-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary text-[11px] font-bold uppercase tracking-wider mb-2">
            <ShieldCheckIcon className="w-3.5 h-3.5" />
            <span>Team &amp; Access Control</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
            Workspace Team &amp; Client Portal Access
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-gray-500 dark:text-zinc-400">
            <span>
              Agency:{" "}
              <strong className="text-gray-900 dark:text-white">
                {currentUser.agency_name}
              </strong>
            </span>
            <span className="font-mono px-2 py-0.5 rounded-md bg-gray-100 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-[11px]">
              /{currentUser.agency_slug}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-primary/10 text-primary border border-primary/20">
              Your Role: {currentUser.role}
            </span>
            {currentUser.is_platform_admin && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                Platform Admin
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 shrink-0">
          <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900/80 border border-gray-200 dark:border-zinc-800 flex flex-col">
            <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-zinc-500">
              Active Staff
            </span>
            <span className="text-lg font-extrabold text-gray-900 dark:text-white tabular-nums">
              {activeStaffCount} / {teamData.staff.length}
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900/80 border border-gray-200 dark:border-zinc-800 flex flex-col">
            <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-zinc-500">
              Portal Clients
            </span>
            <span className="text-lg font-extrabold text-primary tabular-nums">
              {activeClientCount} / {teamData.clients.length}
            </span>
          </div>
          <div className="col-span-2 sm:col-span-1 p-3.5 rounded-2xl bg-white dark:bg-zinc-900/80 border border-gray-200 dark:border-zinc-800 flex flex-col">
            <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-zinc-500">
              {isPlatformAdmin ? "Client Agencies" : "Company Accounts"}
            </span>
            <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {isPlatformAdmin ? agencies.length : teamData.companies.length}
            </span>
          </div>
        </div>
      </div>

      {/* Onboarding & Sign-In Instructions Banner */}
      <div
        role="region"
        aria-label="Invite and SSO onboarding guide"
        className="p-4 sm:p-5 rounded-2xl bg-primary/5 dark:bg-primary/10 border border-primary/20 flex flex-col sm:flex-row gap-3 sm:items-start"
      >
        <div className="w-9 h-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
          <InformationCircleIcon className="w-5 h-5" />
        </div>
        <div className="space-y-1.5 text-xs text-gray-700 dark:text-zinc-300">
          <h2 className="font-bold text-gray-900 dark:text-white">
            How Founders, Staff, and Clients accept workspace access
          </h2>
          <p className="leading-relaxed">
            <strong>1. Email Invite Link:</strong> New users receive an invitation email to confirm
            their account and set a password before landing directly in{" "}
            <span className="font-mono text-primary">/crm</span> (Founders &amp; Staff) or{" "}
            <span className="font-mono text-primary">/portal</span> (Clients).
          </p>
          <p className="leading-relaxed">
            <strong>2. Google SSO:</strong> Users whose Google email matches their invited address
            can also sign in right away on{" "}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              /login
            </Link>{" "}
            with <strong>Google</strong>—AgencyDesk routes them automatically into{" "}
            <span className="font-mono">/crm</span> or <span className="font-mono">/portal</span>.
          </p>
        </div>
      </div>

      {/* Read-Only Notice for Non-Admin Staff */}
      {!isAdmin && (
        <div
          role="status"
          className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center gap-3 text-xs text-amber-800 dark:text-amber-200"
        >
          <LockClosedIcon className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span>
            <strong>Read-only view:</strong> Only agency admins or founders can invite members,
            update staff roles, or change client portal permissions.
          </span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div
        role="tablist"
        aria-label="Team and access sections"
        className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "staff"}
          onClick={() => setActiveTab("staff")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === "staff"
              ? "bg-primary text-white shadow-md shadow-primary/20"
              : "bg-white dark:bg-zinc-900 text-gray-600 dark:text-zinc-300 border border-gray-200 dark:border-zinc-800 hover:border-primary/40"
          }`}
        >
          <UserGroupIcon className="w-4 h-4" />
          <span>Team &amp; Staff</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
              activeTab === "staff"
                ? "bg-white/20 text-white"
                : "bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300"
            }`}
          >
            {teamData.staff.length}
          </span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "clients"}
          onClick={() => setActiveTab("clients")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === "clients"
              ? "bg-primary text-white shadow-md shadow-primary/20"
              : "bg-white dark:bg-zinc-900 text-gray-600 dark:text-zinc-300 border border-gray-200 dark:border-zinc-800 hover:border-primary/40"
          }`}
        >
          <EnvelopeIcon className="w-4 h-4" />
          <span>Client Portal Access</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
              activeTab === "clients"
                ? "bg-white/20 text-white"
                : "bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300"
            }`}
          >
            {teamData.clients.length}
          </span>
        </button>

        {isPlatformAdmin && (
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "agencies"}
            onClick={() => setActiveTab("agencies")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === "agencies"
                ? "bg-primary text-white shadow-md shadow-primary/20"
                : "bg-white dark:bg-zinc-900 text-gray-600 dark:text-zinc-300 border border-gray-200 dark:border-zinc-800 hover:border-primary/40"
            }`}
          >
            <BuildingOffice2Icon className="w-4 h-4" />
            <span>Client Agencies &amp; Founders</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                activeTab === "agencies"
                  ? "bg-white/20 text-white"
                  : "bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300"
              }`}
            >
              {agencies.length}
            </span>
          </button>
        )}
      </div>

      {/* TAB 1: TEAM & STAFF */}
      {activeTab === "staff" && (
        <div role="tabpanel" aria-label="Team and Staff" className="flex flex-col gap-6">
          {isAdmin && (
            <form
              onSubmit={handleInviteStaff}
              className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-zinc-900/80 border border-gray-200 dark:border-zinc-800 shadow-xs space-y-4"
            >
              <div className="flex items-center gap-2">
                <UserPlusIcon className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                  Invite Staff Member
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                <div className="sm:col-span-6">
                  <label
                    htmlFor="staff-invite-email"
                    className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-1.5"
                  >
                    Staff Email Address
                  </label>
                  <input
                    id="staff-invite-email"
                    type="email"
                    required
                    value={staffEmail}
                    onChange={(e) => setStaffEmail(e.target.value)}
                    placeholder="teammate@agency.com"
                    className="w-full h-10 px-3.5 rounded-xl bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label
                    htmlFor="staff-invite-role"
                    className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-1.5"
                  >
                    Workspace Role
                  </label>
                  <select
                    id="staff-invite-role"
                    value={staffRole}
                    onChange={(e) => setStaffRole(e.target.value as TeamRole)}
                    className="w-full h-10 px-3 rounded-xl bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-primary"
                  >
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full h-10 inline-flex items-center justify-center gap-1.5 px-4 rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-white shadow-sm shadow-primary/20 transition-all cursor-pointer disabled:opacity-60"
                  >
                    <PlusIcon className="w-4 h-4" />
                    <span>{submitting ? "Inviting..." : "Invite Staff Member"}</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Staff Roster Table */}
          <div className="rounded-3xl bg-white dark:bg-zinc-900/80 border border-gray-200 dark:border-zinc-800 shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                Agency Staff Roster
              </h2>
              <span className="text-xs text-gray-500 dark:text-zinc-400 tabular-nums">
                {teamData.staff.length} members
              </span>
            </div>

            <div className="overflow-x-auto">
              <table aria-label="Staff roster" className="w-full text-left text-xs min-w-[540px]">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 text-gray-400 dark:text-zinc-500 uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4 font-semibold">Member</th>
                    <th className="py-3.5 px-4 font-semibold">Role</th>
                    <th className="py-3.5 px-4 font-semibold">Status</th>
                    {isAdmin && <th className="py-3.5 px-4 font-semibold text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800 text-gray-700 dark:text-zinc-300">
                  {teamData.staff.length === 0 ? (
                    <tr>
                      <td
                        colSpan={isAdmin ? 4 : 3}
                        className="py-10 px-4 text-center text-xs text-gray-500 dark:text-zinc-400"
                      >
                        No staff members found in this agency.
                      </td>
                    </tr>
                  ) : (
                    teamData.staff.map((member) => {
                      const isSelf = member.user_id === currentUser.user_id;
                      const isRowBusy = mutatingKey === `staff:${member.user_id}`;

                      return (
                        <tr
                          key={member.user_id}
                          className="hover:bg-gray-50/70 dark:hover:bg-zinc-800/40 transition-colors"
                        >
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-[11px] flex items-center justify-center shrink-0">
                                {member.email.slice(0, 2).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <span className="font-semibold text-gray-900 dark:text-white break-all">
                                  {member.email}
                                </span>
                                {isSelf && (
                                  <span className="ml-2 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-primary/10 text-primary">
                                    You
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            {isAdmin ? (
                              <select
                                aria-label={`Role for ${member.email}`}
                                value={member.role}
                                disabled={isSelf || isRowBusy}
                                onChange={(e) =>
                                  void handleUpdateStaff(member, {
                                    role: e.target.value as TeamRole,
                                  })
                                }
                                className="h-8 px-2.5 rounded-lg bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 text-xs font-semibold text-gray-900 dark:text-white disabled:opacity-60"
                              >
                                <option value="staff">Staff</option>
                                <option value="admin">Admin</option>
                              </select>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 border border-gray-200 dark:border-zinc-700">
                                {member.role}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                                member.active
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25"
                                  : "bg-gray-200 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 border-gray-300 dark:border-zinc-700"
                              }`}
                            >
                              {member.active ? "Active" : "Inactive"}
                            </span>
                          </td>
                          {isAdmin && (
                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              <button
                                type="button"
                                aria-label={`${member.active ? "Deactivate" : "Reactivate"} ${
                                  member.email
                                }`}
                                disabled={isSelf || isRowBusy}
                                onClick={() =>
                                  void handleUpdateStaff(member, { active: !member.active })
                                }
                                className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold border transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                                  member.active
                                    ? "bg-gray-100 dark:bg-zinc-900 text-gray-700 dark:text-zinc-300 border-gray-200 dark:border-zinc-700 hover:border-rose-500/40 hover:text-rose-600 dark:hover:text-rose-400"
                                    : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/20"
                                }`}
                              >
                                {member.active ? "Deactivate" : "Reactivate"}
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CLIENT PORTAL ACCESS */}
      {activeTab === "clients" && (
        <div role="tabpanel" aria-label="Client Portal Access" className="flex flex-col gap-6">
          {isAdmin && (
            <form
              onSubmit={handleInviteClient}
              className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-zinc-900/80 border border-gray-200 dark:border-zinc-800 shadow-xs space-y-4"
            >
              <div className="flex items-center gap-2">
                <UserPlusIcon className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                  Invite Client Portal User
                </h2>
              </div>

              {teamData.companies.length === 0 ? (
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-xs text-gray-600 dark:text-zinc-300">
                  Create a client company in{" "}
                  <Link href="/crm/contacts" className="font-bold text-primary hover:underline">
                    Contacts &amp; Accounts
                  </Link>{" "}
                  before granting client portal access.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-5">
                    <label
                      htmlFor="client-invite-email"
                      className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-1.5"
                    >
                      Client Email Address
                    </label>
                    <input
                      id="client-invite-email"
                      type="email"
                      required
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="stakeholder@clientcompany.com"
                      className="w-full h-10 px-3.5 rounded-xl bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <label
                      htmlFor="client-invite-company"
                      className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-1.5"
                    >
                      Client Company
                    </label>
                    <select
                      id="client-invite-company"
                      value={clientCompanyId}
                      onChange={(e) => setClientCompanyId(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-primary"
                    >
                      {teamData.companies.map((company) => (
                        <option key={company.id} value={company.id}>
                          {company.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <button
                      type="submit"
                      disabled={submitting || !clientCompanyId}
                      className="w-full h-10 inline-flex items-center justify-center gap-1.5 px-4 rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-white shadow-sm shadow-primary/20 transition-all cursor-pointer disabled:opacity-60"
                    >
                      <PlusIcon className="w-4 h-4" />
                      <span>{submitting ? "Granting..." : "Grant Portal Access"}</span>
                    </button>
                  </div>

                  <div className="sm:col-span-12 pt-1">
                    <label
                      htmlFor="client-can-accept"
                      className="inline-flex items-center gap-2 text-xs text-gray-700 dark:text-zinc-300 cursor-pointer"
                    >
                      <input
                        id="client-can-accept"
                        type="checkbox"
                        checked={clientCanAccept}
                        onChange={(e) => setClientCanAccept(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 dark:border-zinc-700 text-primary focus:ring-primary"
                      />
                      <span>Allow this client contact to accept fixed-price proposals in /portal</span>
                    </label>
                  </div>
                </div>
              )}
            </form>
          )}

          {/* Client Portal Access Table */}
          <div className="rounded-3xl bg-white dark:bg-zinc-900/80 border border-gray-200 dark:border-zinc-800 shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                Client Portal Memberships
              </h2>
              <span className="text-xs text-gray-500 dark:text-zinc-400 tabular-nums">
                {teamData.clients.length} memberships
              </span>
            </div>

            <div className="overflow-x-auto">
              <table
                aria-label="Client portal access"
                className="w-full text-left text-xs min-w-[600px]"
              >
                <thead>
                  <tr className="border-b border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 text-gray-400 dark:text-zinc-500 uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4 font-semibold">Client Email</th>
                    <th className="py-3.5 px-4 font-semibold">Company</th>
                    <th className="py-3.5 px-4 font-semibold">Proposal Approval</th>
                    <th className="py-3.5 px-4 font-semibold">Status</th>
                    {isAdmin && <th className="py-3.5 px-4 font-semibold text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800 text-gray-700 dark:text-zinc-300">
                  {teamData.clients.length === 0 ? (
                    <tr>
                      <td
                        colSpan={isAdmin ? 5 : 4}
                        className="py-10 px-4 text-center text-xs text-gray-500 dark:text-zinc-400"
                      >
                        No client portal users have been invited yet.
                      </td>
                    </tr>
                  ) : (
                    teamData.clients.map((client) => {
                      const rowKey = `client:${client.user_id}:${client.company_id}`;
                      const isRowBusy = mutatingKey === rowKey;

                      return (
                        <tr
                          key={`${client.user_id}:${client.company_id}`}
                          className="hover:bg-gray-50/70 dark:hover:bg-zinc-800/40 transition-colors"
                        >
                          <td className="py-3.5 px-4 font-semibold text-gray-900 dark:text-white break-all">
                            {client.email}
                          </td>
                          <td className="py-3.5 px-4 text-gray-700 dark:text-zinc-300">
                            {client.company_name}
                          </td>
                          <td className="py-3.5 px-4">
                            {isAdmin ? (
                              <button
                                type="button"
                                aria-label={`Toggle proposal approval for ${client.email} at ${client.company_name}`}
                                disabled={isRowBusy}
                                onClick={() =>
                                  void handleUpdateClient(client, {
                                    can_accept_proposals: !client.can_accept_proposals,
                                  })
                                }
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border transition-colors cursor-pointer disabled:opacity-60 ${
                                  client.can_accept_proposals
                                    ? "bg-primary/10 text-primary border-primary/25 hover:bg-primary/20"
                                    : "bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 border-gray-200 dark:border-zinc-700 hover:border-primary/40"
                                }`}
                              >
                                <CheckCircleIcon className="w-3 h-3" />
                                <span>
                                  {client.can_accept_proposals ? "Can Approve" : "View Only"}
                                </span>
                              </button>
                            ) : (
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                                  client.can_accept_proposals
                                    ? "bg-primary/10 text-primary border-primary/25"
                                    : "bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 border-gray-200 dark:border-zinc-700"
                                }`}
                              >
                                {client.can_accept_proposals ? "Can Approve" : "View Only"}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                                client.active
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25"
                                  : "bg-gray-200 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 border-gray-300 dark:border-zinc-700"
                              }`}
                            >
                              {client.active ? "Active" : "Inactive"}
                            </span>
                          </td>
                          {isAdmin && (
                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              <button
                                type="button"
                                aria-label={`${
                                  client.active ? "Deactivate" : "Reactivate"
                                } portal access for ${client.email} at ${client.company_name}`}
                                disabled={isRowBusy}
                                onClick={() =>
                                  void handleUpdateClient(client, { active: !client.active })
                                }
                                className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold border transition-colors cursor-pointer disabled:opacity-60 ${
                                  client.active
                                    ? "bg-gray-100 dark:bg-zinc-900 text-gray-700 dark:text-zinc-300 border-gray-200 dark:border-zinc-700 hover:border-rose-500/40 hover:text-rose-600 dark:hover:text-rose-400"
                                    : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/20"
                                }`}
                              >
                                {client.active ? "Deactivate" : "Reactivate"}
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PLATFORM ADMIN — CLIENT AGENCIES & FOUNDERS */}
      {activeTab === "agencies" && isPlatformAdmin && (
        <div
          role="tabpanel"
          aria-label="Client Agencies and Founders"
          className="flex flex-col gap-6"
        >
          <form
            onSubmit={handleCreateAgency}
            className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-zinc-900/80 border border-gray-200 dark:border-zinc-800 shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <BuildingOffice2Icon className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                  Onboard Client Agency &amp; Invite Founder
                </h2>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                Platform Admin Only
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-4">
                <label
                  htmlFor="agency-name"
                  className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-1.5"
                >
                  Agency Name
                </label>
                <input
                  id="agency-name"
                  type="text"
                  required
                  value={agencyName}
                  onChange={(e) => {
                    const nextName = e.target.value;
                    setAgencyName(nextName);
                    if (!slugEdited) {
                      setAgencySlug(slugifyAgencyName(nextName));
                    }
                  }}
                  placeholder="Acme Digital Studio"
                  className="w-full h-10 px-3.5 rounded-xl bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div className="sm:col-span-3">
                <label
                  htmlFor="agency-slug"
                  className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-1.5"
                >
                  Workspace Slug
                </label>
                <input
                  id="agency-slug"
                  type="text"
                  required
                  pattern="^[a-z0-9][a-z0-9-]{2,79}$"
                  value={agencySlug}
                  onChange={(e) => {
                    setSlugEdited(true);
                    setAgencySlug(e.target.value.toLowerCase());
                  }}
                  placeholder="acme-digital"
                  className="w-full h-10 px-3.5 rounded-xl bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 text-xs font-mono text-gray-900 dark:text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div className="sm:col-span-5">
                <label
                  htmlFor="agency-founder-email"
                  className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-1.5"
                >
                  Founder Email (Invited as Admin)
                </label>
                <input
                  id="agency-founder-email"
                  type="email"
                  required
                  value={founderEmail}
                  onChange={(e) => setFounderEmail(e.target.value)}
                  placeholder="founder@acmedigital.com"
                  className="w-full h-10 px-3.5 rounded-xl bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div className="sm:col-span-12 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <p className="text-[11px] text-gray-500 dark:text-zinc-400">
                  Creates an isolated agency workspace and invites the founder with{" "}
                  <span className="font-mono font-semibold">admin</span> access.
                </p>
                <button
                  type="submit"
                  disabled={submitting}
                  className="h-10 inline-flex items-center justify-center gap-1.5 px-5 rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-white shadow-sm shadow-primary/20 transition-all cursor-pointer disabled:opacity-60 shrink-0"
                >
                  <PlusIcon className="w-4 h-4" />
                  <span>{submitting ? "Creating..." : "Create Agency & Invite Founder"}</span>
                </button>
              </div>
            </div>
          </form>

          {/* Agencies Directory */}
          <div className="rounded-3xl bg-white dark:bg-zinc-900/80 border border-gray-200 dark:border-zinc-800 shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                Client Agencies Directory
              </h2>
              <span className="text-xs text-gray-500 dark:text-zinc-400 tabular-nums">
                {agencies.length} agencies
              </span>
            </div>

            <div className="overflow-x-auto">
              <table
                aria-label="Client agencies"
                className="w-full text-left text-xs min-w-[640px]"
              >
                <thead>
                  <tr className="border-b border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 text-gray-400 dark:text-zinc-500 uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4 font-semibold">Agency</th>
                    <th className="py-3.5 px-4 font-semibold">Founders / Admins</th>
                    <th className="py-3.5 px-4 font-semibold">Staff</th>
                    <th className="py-3.5 px-4 font-semibold">Created</th>
                    <th className="py-3.5 px-4 font-semibold">Public Intake</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800 text-gray-700 dark:text-zinc-300">
                  {agencies.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-10 px-4 text-center text-xs text-gray-500 dark:text-zinc-400"
                      >
                        No agencies registered yet.
                      </td>
                    </tr>
                  ) : (
                    agencies.map((agency) => {
                      const isRowBusy = mutatingKey === `agency:${agency.id}`;
                      return (
                        <tr
                          key={agency.id}
                          className="hover:bg-gray-50/70 dark:hover:bg-zinc-800/40 transition-colors"
                        >
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-gray-900 dark:text-white">
                              {agency.name}
                            </div>
                            <div className="text-[11px] font-mono text-gray-400 dark:text-zinc-500">
                              /{agency.slug}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            {agency.admins.length === 0 ? (
                              <span className="text-gray-400 italic">None assigned</span>
                            ) : (
                              <div className="flex flex-col gap-0.5">
                                {agency.admins.map((admin) => (
                                  <span key={admin.user_id} className="break-all">
                                    {admin.email}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-semibold tabular-nums">
                            {agency.staff_count}
                          </td>
                          <td className="py-3.5 px-4 text-gray-500 dark:text-zinc-400 whitespace-nowrap">
                            {formatDate(agency.created_at)}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                                agency.intake_enabled
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25"
                                  : "bg-gray-200 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 border-gray-300 dark:border-zinc-700"
                              }`}
                            >
                              {agency.intake_enabled ? "Intake Enabled" : "Intake Paused"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <button
                              type="button"
                              aria-label={`${
                                agency.intake_enabled ? "Pause" : "Enable"
                              } intake for ${agency.name}`}
                              disabled={isRowBusy}
                              onClick={() => void handleToggleAgencyIntake(agency)}
                              className="px-3 py-1.5 rounded-xl text-[11px] font-semibold bg-gray-100 dark:bg-zinc-900 text-gray-700 dark:text-zinc-300 border border-gray-200 dark:border-zinc-700 hover:border-primary/50 transition-colors cursor-pointer disabled:opacity-60"
                            >
                              {agency.intake_enabled ? "Pause Intake" : "Enable Intake"}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
