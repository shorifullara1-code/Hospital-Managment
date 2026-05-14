'use client'

import { useState, useEffect, useMemo } from 'react'
import { Plus, Search, Calendar, CheckCircle2, XCircle, Clock, Save, FileSpreadsheet, Users, ClipboardCheck } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

type Staff = {
  id: string
  name: string
  designation: string
  joined_at: string
}

type AttendanceStatus = 'present' | 'absent' | 'leave'

type AttendanceRecord = {
  id?: string
  staff_id: string
  date: string
  status: AttendanceStatus
}

export default function StaffPage() {
  const [activeTab, setActiveTab] = useState<'register' | 'attendance' | 'summary'>('register')
  const [staffs, setStaffs] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [dailyAttendance, setDailyAttendance] = useState<Record<string, AttendanceStatus>>({})
  const [monthlyRecords, setMonthlyRecords] = useState<AttendanceRecord[]>([])

  // Form State
  const [newStaff, setNewStaff] = useState({ name: '', designation: '' })

  useEffect(() => {
    fetchStaffs()
    fetchDailyAttendance()
    fetchMonthlyRecords()
  }, [])

  useEffect(() => {
    fetchDailyAttendance()
  }, [selectedDate])

  const fetchStaffs = async () => {
    try {
      const { data, error } = await supabase.from('staff').select('*').order('name')
      if (error) throw error
      setStaffs(data || [])
    } catch (err) {
      console.error('Error fetching staffs:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchDailyAttendance = async () => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd')
    try {
      const { data, error } = await supabase
        .from('staff_attendance')
        .select('*')
        .eq('date', dateStr)
      
      if (error) throw error
      
      const attMap: Record<string, AttendanceStatus> = {}
      data?.forEach(rec => {
        attMap[rec.staff_id] = rec.status
      })
      setDailyAttendance(attMap)
    } catch (err) {
      console.error('Error fetching attendance:', err)
    }
  }

  const fetchMonthlyRecords = async () => {
    const start = format(startOfMonth(selectedDate), 'yyyy-MM-dd')
    const end = format(endOfMonth(selectedDate), 'yyyy-MM-dd')
    try {
      const { data, error } = await supabase
        .from('staff_attendance')
        .select('*')
        .gte('date', start)
        .lte('date', end)
      
      if (error) throw error
      setMonthlyRecords(data || [])
    } catch (err) {
      console.error('Error fetching monthly records:', err)
    }
  }

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newStaff.name) return

    try {
      const { data, error } = await supabase
        .from('staff')
        .insert([{ ...newStaff, joined_at: new Date().toISOString() }])
        .select()
      
      if (error) throw error
      setStaffs([...staffs, data[0]])
      setNewStaff({ name: '', designation: '' })
    } catch (err) {
      console.error('Error adding staff:', err)
    }
  }

  const handleMarkAttendance = (staffId: string, status: AttendanceStatus) => {
    setDailyAttendance(prev => ({ ...prev, [staffId]: status }))
  }

  const saveAttendance = async () => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd')
    const records = Object.entries(dailyAttendance).map(([staffId, status]) => ({
      staff_id: staffId,
      date: dateStr,
      status: status
    }))

    try {
      const { error } = await supabase
        .from('staff_attendance')
        .upsert(records, { onConflict: 'staff_id,date' })
      
      if (error) throw error
      fetchMonthlyRecords()
      alert('Attendance saved successfully')
    } catch (err) {
      console.error('Error saving attendance:', err)
    }
  }

  const summaryData = useMemo(() => {
    return staffs.map(staff => {
      const records = monthlyRecords.filter(r => r.staff_id === staff.id)
      return {
        ...staff,
        present: records.filter(r => r.status === 'present').length,
        absent: records.filter(r => r.status === 'absent').length,
        leave: records.filter(r => r.status === 'leave').length,
        total: records.length
      }
    })
  }, [staffs, monthlyRecords])

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Staff Register</h1>
        <p className="text-gray-500 mt-2">Manage staff details and track daily attendance</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-8 w-fit">
        {[
          { id: 'register', label: 'Staff Registration', icon: Users },
          { id: 'attendance', label: 'Daily Attendance', icon: ClipboardCheck },
          { id: 'summary', label: 'Monthly Summary', icon: FileSpreadsheet },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center px-4 py-2 text-sm font-medium rounded-md transition-all",
              activeTab === tab.id 
                ? "bg-white text-gray-900 shadow-sm" 
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            <tab.icon className="w-4 h-4 mr-2" />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'register' && (
          <motion.div
            key="register"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <Plus className="w-5 h-5 mr-2 text-blue-500" />
                Add New Staff
              </h2>
              <form onSubmit={handleAddStaff} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="Staff Name"
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newStaff.name}
                  onChange={e => setNewStaff({ ...newStaff, name: e.target.value })}
                  required
                />
                <input
                  type="text"
                  placeholder="Designation"
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newStaff.designation}
                  onChange={e => setNewStaff({ ...newStaff, designation: e.target.value })}
                />
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Register Staff
                </button>
              </form>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Designation</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Joined At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {staffs.map(staff => (
                    <tr key={staff.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{staff.name}</td>
                      <td className="px-6 py-4 text-gray-600">{staff.designation}</td>
                      <td className="px-6 py-4 text-gray-500 text-sm">
                        {staff.joined_at ? format(new Date(staff.joined_at), 'MMM dd, yyyy') : '-'}
                      </td>
                    </tr>
                  ))}
                  {staffs.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-gray-400">
                        No staff registered yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeTab === 'attendance' && (
          <motion.div
            key="attendance"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center space-x-4">
                <Calendar className="w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  className="border-none focus:ring-0 text-lg font-medium"
                  value={format(selectedDate, 'yyyy-MM-dd')}
                  onChange={e => setSelectedDate(parseISO(e.target.value))}
                />
              </div>
              <button
                onClick={saveAttendance}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Attendance
              </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Staff Information</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {staffs.map(staff => (
                    <tr key={staff.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{staff.name}</div>
                        <div className="text-xs text-gray-500">{staff.designation}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center space-x-4">
                          {[
                            { id: 'present', label: 'Present', icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50' },
                            { id: 'absent', label: 'Absent', icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' },
                            { id: 'leave', label: 'Leave', icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50' },
                          ].map(status => (
                            <button
                              key={status.id}
                              onClick={() => handleMarkAttendance(staff.id, status.id as any)}
                              className={cn(
                                "flex flex-col items-center p-3 rounded-xl transition-all border-2",
                                dailyAttendance[staff.id] === status.id
                                  ? cn(status.bg, status.color, "border-current")
                                  : "border-transparent text-gray-400 hover:bg-gray-50"
                              )}
                            >
                              <status.icon className="w-6 h-6 mb-1" />
                              <span className="text-[10px] font-bold uppercase tracking-wider">{status.label}</span>
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeTab === 'summary' && (
          <motion.div
            key="summary"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 uppercase">Monthly Summary</h2>
                <p className="text-gray-500">{format(selectedDate, 'MMMM yyyy')}</p>
              </div>
              <button className="flex items-center text-blue-600 hover:text-blue-700 font-medium">
                <FileSpreadsheet className="w-5 h-5 mr-2" />
                Export Report
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {[
                { label: 'Total Present', value: summaryData.reduce((acc, s) => acc + s.present, 0), color: 'bg-green-500' },
                { label: 'Total Absent', value: summaryData.reduce((acc, s) => acc + s.absent, 0), color: 'bg-red-500' },
                { label: 'Total Leaves', value: summaryData.reduce((acc, s) => acc + s.leave, 0), color: 'bg-orange-500' },
              ].map((stat, i) => (
                <div key={i} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center">
                  <div className={cn("w-12 h-12 rounded-full flex items-center justify-center mr-4 bg-opacity-10", stat.color.replace('bg-', 'text-'))}>
                    <div className={cn("w-3 h-3 rounded-full animate-pulse", stat.color)} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Staff</th>
                    <th className="px-6 py-4 text-xs font-semibold text-green-600 uppercase text-center">Present</th>
                    <th className="px-6 py-4 text-xs font-semibold text-red-600 uppercase text-center">Absent</th>
                    <th className="px-6 py-4 text-xs font-semibold text-orange-600 uppercase text-center">Leave</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase text-center">Total tracked</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {summaryData.map(staff => (
                    <tr key={staff.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{staff.name}</div>
                        <div className="text-xs text-gray-500">{staff.designation}</div>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-green-600 bg-green-50/30">{staff.present}</td>
                      <td className="px-6 py-4 text-center font-bold text-red-600 bg-red-50/30">{staff.absent}</td>
                      <td className="px-6 py-4 text-center font-bold text-orange-600 bg-orange-50/30">{staff.leave}</td>
                      <td className="px-6 py-4 text-center text-gray-500">{staff.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
