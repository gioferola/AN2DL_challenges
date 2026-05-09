import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar as CalendarIcon, Trophy, MapPin, Clock, ArrowLeft } from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000';

function App() {
  const [disciplines, setDisciplines] = useState([]);
  const [selectedCalendar, setSelectedCalendar] = useState(null);
  const [matches, setMatches] = useState([]);
  const [rankings, setRankings] = useState([]);
  const [activeTab, setActiveTab] = useState('matches');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDisciplines();
  }, []);

  const fetchDisciplines = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/disciplines`);
      setDisciplines(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching disciplines:', error);
      setLoading(false);
    }
  };

  const loadCalendar = async (calendar) => {
    setSelectedCalendar(calendar);
    setLoading(true);
    try {
      const [matchesRes, rankingsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/calendars/${calendar.id}/matches`),
        axios.get(`${API_BASE_URL}/calendars/${calendar.id}/rankings`)
      ]);
      setMatches(matchesRes.data);
      setRankings(rankingsRes.data);
    } catch (error) {
      console.error('Error fetching calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !selectedCalendar && disciplines.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 border-solid"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-700 text-white shadow-lg sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Trophy className="h-8 w-8 text-yellow-400" />
            <h1 className="text-2xl font-bold tracking-tight">Gestione Campionati</h1>
          </div>
          {selectedCalendar && (
            <button
              onClick={() => setSelectedCalendar(null)}
              className="flex items-center space-x-2 text-white hover:text-blue-200 transition-colors bg-blue-800 px-4 py-2 rounded-md"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="hidden sm:inline">Torna ai Tornei</span>
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!selectedCalendar ? (
          <div className="space-y-8">
            <h2 className="text-3xl font-extrabold text-gray-900">Seleziona un Torneo</h2>
            <div className="grid gap-6 lg:grid-cols-2">
              {disciplines.map(discipline => (
                <div key={discipline.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-gray-200">
                  <div className="bg-blue-50 px-6 py-4 border-b border-gray-200">
                    <h3 className="text-xl font-bold text-blue-900">{discipline.name}</h3>
                  </div>
                  <div className="p-6">
                    {discipline.categories.map(category => (
                      <div key={category.id} className="mb-6 last:mb-0">
                        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">{category.name}</h4>
                        <div className="space-y-2">
                          {category.calendars.map(calendar => (
                            <button
                              key={calendar.id}
                              onClick={() => loadCalendar(calendar)}
                              className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-blue-600 hover:text-white rounded-lg transition-colors group flex items-center justify-between border border-gray-200 hover:border-blue-600"
                            >
                              <span className="font-medium">{calendar.name}</span>
                              <CalendarIcon className="h-5 w-5 text-gray-400 group-hover:text-blue-200" />
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-8">
              <h2 className="text-3xl font-extrabold text-gray-900 mb-2">{selectedCalendar.name}</h2>
              <div className="flex space-x-4 border-b border-gray-300">
                <button
                  className={`py-3 px-6 font-medium text-lg border-b-2 transition-colors ${activeTab === 'matches' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                  onClick={() => setActiveTab('matches')}
                >
                  Calendario e Risultati
                </button>
                <button
                  className={`py-3 px-6 font-medium text-lg border-b-2 transition-colors ${activeTab === 'rankings' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                  onClick={() => setActiveTab('rankings')}
                >
                  Classifica
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600 border-solid"></div>
              </div>
            ) : activeTab === 'matches' ? (
              <div className="space-y-10">
                {matches.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-xl shadow">
                    <p className="text-gray-500 text-lg">Nessuna gara trovata per questo torneo.</p>
                  </div>
                ) : (
                  matches.map((giornata, idx) => (
                    <div key={idx} className="bg-white rounded-xl shadow-md overflow-hidden">
                      <div className="bg-gray-800 text-white px-6 py-3">
                        <h3 className="text-lg font-bold">{giornata.giornata_name}</h3>
                      </div>
                      <div className="divide-y divide-gray-200">
                        {giornata.matches.map(match => {
                          const date = match.date_timestamp ? new Date(match.date_timestamp * 1000) : null;
                          const dateStr = date ? date.toLocaleDateString('it-IT', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }) : '';
                          const timeStr = date ? date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) : '';
                          const isPlayed = match.status === 'COMPLETED';

                          return (
                            <div key={match.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex-1 space-y-1 text-sm text-gray-500">
                                  {date && (
                                    <div className="flex items-center space-x-2">
                                      <Clock className="h-4 w-4" />
                                      <span className="font-medium text-gray-700">{dateStr} - {timeStr}</span>
                                    </div>
                                  )}
                                  {match.location_name && (
                                    <div className="flex items-center space-x-2">
                                      <MapPin className="h-4 w-4" />
                                      <span className="truncate">{match.location_name}</span>
                                    </div>
                                  )}
                                  <div className="mt-2 inline-block px-2 py-1 bg-gray-100 rounded text-xs font-semibold text-gray-600">
                                    {match.status_name}
                                  </div>
                                </div>

                                <div className="flex-2 flex items-center justify-center space-x-4 min-w-[300px]">
                                  <div className="flex-1 text-right font-bold text-gray-900 text-lg">
                                    {match.team1_name}
                                  </div>

                                  <div className="flex-shrink-0 flex items-center justify-center bg-gray-100 rounded-lg w-20 h-12">
                                    {isPlayed && match.score ? (
                                      <span className="text-xl font-black text-blue-700 tracking-wider">{match.score}</span>
                                    ) : (
                                      <span className="text-gray-400 font-medium">vs</span>
                                    )}
                                  </div>

                                  <div className="flex-1 text-left font-bold text-gray-900 text-lg">
                                    {match.team2_name}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                {rankings.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">Nessuna classifica disponibile.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-800 text-white">
                        <tr>
                          <th scope="col" className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider w-16">Pos</th>
                          <th scope="col" className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Squadra</th>
                          <th scope="col" className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider">Pt</th>
                          <th scope="col" className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider hidden sm:table-cell">G</th>
                          <th scope="col" className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider hidden md:table-cell">V</th>
                          <th scope="col" className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider hidden md:table-cell">N</th>
                          <th scope="col" className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider hidden md:table-cell">P</th>
                          <th scope="col" className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider hidden lg:table-cell">GF</th>
                          <th scope="col" className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider hidden lg:table-cell">GS</th>
                          <th scope="col" className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider">DR</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {rankings.map((rank, idx) => (
                          <tr key={rank.id} className={idx < 3 ? 'bg-blue-50/50' : 'hover:bg-gray-50'}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                                idx === 0 ? 'bg-yellow-400 text-white' :
                                idx === 1 ? 'bg-gray-300 text-gray-800' :
                                idx === 2 ? 'bg-orange-300 text-orange-900' :
                                'text-gray-500'
                              }`}>
                                {idx + 1}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="font-bold text-gray-900 text-lg">{rank.team_name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center font-black text-blue-700 text-xl">
                              {rank.points}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-gray-500 hidden sm:table-cell">{rank.played}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-gray-500 hidden md:table-cell">{rank.won}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-gray-500 hidden md:table-cell">{rank.drawn}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-gray-500 hidden md:table-cell">{rank.lost}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-gray-500 hidden lg:table-cell">{rank.goals_for}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-gray-500 hidden lg:table-cell">{rank.goals_against}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-center font-semibold text-gray-700">
                              <span className={rank.goal_difference > 0 ? 'text-green-600' : rank.goal_difference < 0 ? 'text-red-600' : ''}>
                                {rank.goal_difference > 0 ? '+' : ''}{rank.goal_difference}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
