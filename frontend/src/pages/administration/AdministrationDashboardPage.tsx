import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building, 
  Calendar, 
  Settings 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const AdministrationDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const isAdmin = user?.role === 'SCHOOL_ADMIN' || user?.role === 'HEADMASTER';

  const cards = [
    {
      title: 'School Settings',
      description: 'Manage school identity, contact information, and general configuration.',
      icon: Building,
      color: 'bg-blue-500',
      path: '/administration/settings',
      restricted: !isAdmin,
    },
    {
      title: 'School Calendar',
      description: 'View and manage academic events, holidays, exams, and meetings.',
      icon: Calendar,
      color: 'bg-purple-500',
      path: '/administration/calendar',
      restricted: false,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Settings className="w-8 h-8 text-slate-600" />
          School Administration
        </h1>
        <p className="text-slate-500 mt-1">
          Central management for school operations, configuration, and calendar.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => {
          if (card.restricted) return null;

          return (
            <div
              key={card.title}
              onClick={() => navigate(card.path)}
              className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col items-start text-left"
            >
              <div className={`p-3 rounded-xl text-white mb-4 ${card.color}`}>
                <card.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">{card.title}</h3>
              <p className="text-slate-500 text-sm">{card.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
