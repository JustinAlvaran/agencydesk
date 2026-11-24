"use client";

import React, { useState } from "react";
import type { Contact } from "@/types/crm";
import {CreateRecord} from "@/components/crm/create-record";
import { MagnifyingGlassIcon, PhoneIcon, EnvelopeIcon } from "@heroicons/react/24/outline";

export default function View({contacts,leads=[],companies=[]}: {contacts:Contact[];leads?:{id:string;contact_name:string}[];companies?:{id:string;name:string}[]}) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            Client Directory
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-1">
            Contacts &amp; Accounts
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400 mt-0.5">
            Stakeholder records, associated company accounts, and lifetime value.
          </p>
        </div>

        <CreateRecord kind="contact" leads={leads} companies={companies} />
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900/80 border border-gray-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, company, or email..."
            className="w-full h-9 pl-9 pr-4 rounded-xl bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-primary/50"
          />
        </div>
        <span className="text-xs text-gray-400 dark:text-zinc-500">
          {filteredContacts.length} contacts
        </span>
      </div>

      {contacts.length===0 && <p className="text-sm text-gray-500">No contacts yet.</p>}
      <p className="text-xs text-gray-500">Showing up to 250 recent records.</p>
      <div className="rounded-2xl bg-white dark:bg-zinc-900/80 border border-gray-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 text-gray-400 dark:text-zinc-500 uppercase tracking-wider">
                <th className="py-3.5 px-4 font-semibold">Contact Person</th>
                <th className="py-3.5 px-4 font-semibold">Company &amp; Role</th>
                <th className="py-3.5 px-4 font-semibold">Communications</th>
                <th className="py-3.5 px-4 font-semibold">Deals</th>
                <th className="py-3.5 px-4 font-semibold">Lifetime Value</th>
                <th className="py-3.5 px-4 font-semibold">Date Added</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800 text-gray-700 dark:text-zinc-300">
              {filteredContacts.map((contact) => (
                <tr key={contact.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                        {contact.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <span className="font-bold text-gray-900 dark:text-white">
                        {contact.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-gray-900 dark:text-white">{contact.company}</div>
                    <div className="text-[10px] text-gray-400">{contact.role}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 text-gray-600 dark:text-zinc-300">
                      <EnvelopeIcon className="w-3.5 h-3.5 text-gray-400" />
                      <span>{contact.email}</span>
                    </div>
                    {contact.phone && (
                      <div className="flex items-center gap-1.5 text-gray-400 text-[10px] mt-0.5">
                        <PhoneIcon className="w-3 h-3 text-gray-400" />
                        <span>{contact.phone}</span>
                        <a
                          href={`https://wa.me/${contact.phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-1 px-1 py-0.2 rounded text-[8px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20"
                          title="Chat on WhatsApp"
                        >
                          WA
                        </a>
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300">
                      {contact.deals_count} {contact.deals_count === 1 ? "Deal" : "Deals"}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-primary">
                    ${contact.total_value.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-gray-400">{contact.created_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
