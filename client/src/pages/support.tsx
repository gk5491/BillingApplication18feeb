import { useState } from "react";
import { Search, Filter, RefreshCw, Plus, MoreVertical, CheckCircle2, Circle, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import MongoErrorPanel from "@/components/MongoErrorPanel";

const tickets = [
  { id: "#1024", title: "Invoice generation failed", desc: "System throws 500 error when generating PDF for customer #4592", status: "Open", priority: "High", created: "2h ago", assignee: "Alex" },
  { id: "#1023", title: "GST calculation incorrect", desc: "Inter-state tax applied for intra-state transaction in Karnataka", status: "In Progress", priority: "Critical", created: "5h ago", assignee: "Sarah" },
  { id: "#1022", title: "Update email template", desc: "Change the footer address in the default invoice email template", status: "Closed", priority: "Low", created: "1d ago", assignee: "Mike" },
  { id: "#1021", title: "Add new user role", desc: "Need a read-only role for the auditor", status: "Open", priority: "Medium", created: "2d ago", assignee: "Unassigned" },
  { id: "#1020", title: "Login timeout issue", desc: "Session expires too quickly even with 'Remember me' checked", status: "In Progress", priority: "High", created: "3d ago", assignee: "Sarah" },
];

export default function Support() {
  return (
    <div className="p-6 space-y-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Support Tickets</h1>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" /> New Ticket
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50 border-blue-100">
           <CardContent className="p-6 flex items-center justify-between">
              <div>
                 <p className="text-sm font-medium text-blue-600">Total Tickets</p>
                 <p className="text-3xl font-bold text-blue-900 mt-1">24</p>
              </div>
              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                 <MoreVertical className="h-5 w-5" />
              </div>
           </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-100">
           <CardContent className="p-6 flex items-center justify-between">
              <div>
                 <p className="text-sm font-medium text-red-600">Open</p>
                 <p className="text-3xl font-bold text-red-900 mt-1">8</p>
              </div>
              <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                 <AlertCircle className="h-5 w-5" />
              </div>
           </CardContent>
        </Card>
        <Card className="bg-yellow-50 border-yellow-100">
           <CardContent className="p-6 flex items-center justify-between">
              <div>
                 <p className="text-sm font-medium text-yellow-600">In Progress</p>
                 <p className="text-3xl font-bold text-yellow-900 mt-1">5</p>
              </div>
              <div className="h-10 w-10 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600">
                 <Clock className="h-5 w-5" />
              </div>
           </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-100">
           <CardContent className="p-6 flex items-center justify-between">
              <div>
                 <p className="text-sm font-medium text-green-600">Closed</p>
                 <p className="text-3xl font-bold text-green-900 mt-1">11</p>
              </div>
              <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                 <CheckCircle2 className="h-5 w-5" />
              </div>
           </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
        <div className="relative flex-1 w-full">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
           <Input placeholder="Search tickets by title, description, or ID..." className="pl-9" />
        </div>
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
           <Select>
              <SelectTrigger className="w-[130px]">
                 <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                 <SelectItem value="open">Open</SelectItem>
                 <SelectItem value="in_progress">In Progress</SelectItem>
                 <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
           </Select>
           <Select>
              <SelectTrigger className="w-[130px]">
                 <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                 <SelectItem value="high">High</SelectItem>
                 <SelectItem value="medium">Medium</SelectItem>
                 <SelectItem value="low">Low</SelectItem>
              </SelectContent>
           </Select>
           <Select>
              <SelectTrigger className="w-[130px]">
                 <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                 <SelectItem value="bug">Bug</SelectItem>
                 <SelectItem value="feature">Feature</SelectItem>
                 <SelectItem value="billing">Billing</SelectItem>
              </SelectContent>
           </Select>
           <Button variant="outline" size="icon">
              <RefreshCw className="h-4 w-4 text-slate-500" />
           </Button>
        </div>
      </div>

      {/* Ticket List */}
      <div className="space-y-4">
         {tickets.map((ticket) => (
            <div key={ticket.id} className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow flex flex-col md:flex-row gap-4 md:items-center">
               <div className="flex items-start gap-4 flex-1">
                  <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 font-mono text-xs font-medium text-slate-600">
                     {ticket.id}
                  </div>
                  <div>
                     <h3 className="font-semibold text-slate-900 hover:text-blue-600 cursor-pointer">{ticket.title}</h3>
                     <p className="text-sm text-slate-500 mt-1 line-clamp-2">{ticket.desc}</p>
                     <div className="flex items-center gap-2 mt-3">
                        <Badge variant="secondary" className={
                           ticket.status === 'Open' ? 'bg-red-100 text-red-700 hover:bg-red-100' :
                           ticket.status === 'In Progress' ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100' :
                           'bg-green-100 text-green-700 hover:bg-green-100'
                        }>
                           {ticket.status}
                        </Badge>
                        <Badge variant="outline" className="text-xs font-normal text-slate-500">
                           {ticket.priority} Priority
                        </Badge>
                        <span className="text-xs text-slate-400 ml-2">• {ticket.created}</span>
                     </div>
                  </div>
               </div>
               <div className="flex items-center gap-4 pl-14 md:pl-0 border-t md:border-t-0 border-slate-100 pt-3 md:pt-0">
                  <div className="text-right hidden md:block">
                     <p className="text-xs text-slate-400">Assigned to</p>
                     <p className="text-sm font-medium text-slate-700">{ticket.assignee}</p>
                  </div>
               </div>
            </div>
         ))}
      </div>
      
      {/* Demo of MongoDB Error UI */}
      <div className="mt-12 pt-12 border-t border-slate-200">
         <h2 className="text-lg font-semibold text-slate-500 mb-6 uppercase tracking-wider">System Status (Simulation)</h2>
         <MongoErrorPanel />
      </div>
    </div>
  );
}
