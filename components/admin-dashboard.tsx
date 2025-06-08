"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Users, Heart, MessageCircle, AlertTriangle, TrendingUp, Search } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface AdminStats {
  activeUsers: number
  totalMatches: number
  messagesCount: number
  reportsCount: number
  premiumUsers: number
  dailySignups: number
}

interface ReportItem {
  id: string
  reporter_name: string
  reported_name: string
  reason: string
  status: "pending" | "reviewed" | "resolved"
  created_at: string
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats>({
    activeUsers: 0,
    totalMatches: 0,
    messagesCount: 0,
    reportsCount: 0,
    premiumUsers: 0,
    dailySignups: 0,
  })
  const [reports, setReports] = useState<ReportItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "reviewed" | "resolved">("all")

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      // Load stats
      const [usersResult, matchesResult, messagesResult, reportsResult] = await Promise.all([
        supabase.from("users").select("id, is_premium, created_at"),
        supabase.from("matches").select("id"),
        supabase.from("messages").select("id"),
        supabase.from("reports").select("*"),
      ])

      const users = usersResult.data || []
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      setStats({
        activeUsers: users.length,
        totalMatches: matchesResult.data?.length || 0,
        messagesCount: messagesResult.data?.length || 0,
        reportsCount: reportsResult.data?.filter((r) => r.status === "pending").length || 0,
        premiumUsers: users.filter((u) => u.is_premium).length,
        dailySignups: users.filter((u) => new Date(u.created_at) >= today).length,
      })

      // Load reports with user names
      const reportsWithNames = await Promise.all(
        (reportsResult.data || []).map(async (report) => {
          const [reporterResult, reportedResult] = await Promise.all([
            supabase.from("users").select("name").eq("id", report.reporter_id).single(),
            supabase.from("users").select("name").eq("id", report.reported_id).single(),
          ])

          return {
            ...report,
            reporter_name: reporterResult.data?.name || "Unknown",
            reported_name: reportedResult.data?.name || "Unknown",
          }
        }),
      )

      setReports(reportsWithNames)
    } catch (error) {
      console.error("Load dashboard data error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleReportAction = async (reportId: string, action: "approve" | "reject") => {
    try {
      const newStatus = action === "approve" ? "resolved" : "reviewed"

      await supabase.from("reports").update({ status: newStatus }).eq("id", reportId)

      setReports((prev) => prev.map((report) => (report.id === reportId ? { ...report, status: newStatus } : report)))
    } catch (error) {
      console.error("Report action error:", error)
    }
  }

  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      report.reporter_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reported_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reason.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter = filterStatus === "all" || report.status === filterStatus

    return matchesSearch && matchesFilter
  })

  const statCards = [
    {
      icon: Users,
      label: "Active Users",
      value: stats.activeUsers.toLocaleString(),
      change: `+${stats.dailySignups} today`,
      color: "text-blue-500",
    },
    {
      icon: Heart,
      label: "Total Matches",
      value: stats.totalMatches.toLocaleString(),
      change: "+12.1%",
      color: "text-red-500",
    },
    {
      icon: MessageCircle,
      label: "Messages",
      value: stats.messagesCount.toLocaleString(),
      change: "+8.7%",
      color: "text-green-500",
    },
    {
      icon: AlertTriangle,
      label: "Pending Reports",
      value: stats.reportsCount.toString(),
      change: "-15.3%",
      color: "text-orange-500",
    },
    {
      icon: TrendingUp,
      label: "Premium Users",
      value: stats.premiumUsers.toLocaleString(),
      change: "+23.4%",
      color: "text-purple-500",
    },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Monitor and manage your dating app</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {statCards.map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className={`text-sm ${stat.change.startsWith("+") ? "text-green-600" : "text-red-600"}`}>
                      {stat.change}
                    </p>
                  </div>
                  <Icon className={`w-8 h-8 ${stat.color}`} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Reports Section */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">User Reports</h2>
              <div className="flex space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search reports..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reporter
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reported User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{report.reporter_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{report.reported_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{report.reason}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          report.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : report.status === "reviewed"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-green-100 text-green-800"
                        }`}
                      >
                        {report.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(report.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {report.status === "pending" && (
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleReportAction(report.id, "approve")}
                            className="bg-green-500 hover:bg-green-600 text-white"
                          >
                            Resolve
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleReportAction(report.id, "reject")}>
                            Dismiss
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredReports.length === 0 && (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No reports found</h3>
              <p className="text-gray-500">No reports match your current filters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
