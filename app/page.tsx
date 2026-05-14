import Link from 'next/link'
import { Users, ClipboardCheck, ArrowRight } from 'lucide-react'

export default function Home() {
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-12">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
          Staff Dashboard
        </h1>
        <p className="text-xl text-gray-500 mt-4 max-w-2xl">
          Welcome to the Staff Register and Attendance Management system.
          Streamline your HR tasks with real-time tracking and comprehensive reports.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {[
          {
            title: 'Staff Registration',
            description: 'Add new staff members, update designations, and manage your workforce.',
            icon: Users,
            href: '/staff',
            color: 'bg-blue-500',
            linkText: 'Register Staff'
          },
          {
            title: 'Daily Attendance',
            description: 'Mark attendance for today or any other date. Track presence and leaves.',
            icon: ClipboardCheck,
            href: '/staff', // For now pointing to the same page, will open attendance tab
            color: 'bg-green-500',
            linkText: 'Take Attendance'
          },
        ].map((item, i) => (
          <Link 
            key={i} 
            href={item.href}
            className="group relative bg-white p-8 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all h-full"
          >
            <div className={`w-14 h-14 ${item.color} rounded-xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform`}>
              <item.icon className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{item.title}</h3>
            <p className="text-gray-600 mb-8 leading-relaxed">
              {item.description}
            </p>
            <div className="flex items-center text-gray-900 font-bold group-hover:gap-2 transition-all">
              {item.linkText}
              <ArrowRight className="w-5 h-5 ml-2 opacity-0 group-hover:opacity-100 transition-all" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
