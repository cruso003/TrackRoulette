"use client";
import React, { useState, useEffect } from 'react';
import { Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie } from 'recharts';

// User roles and authentication
const ROLES = {
  ADMIN: 'admin',
  USER: 'user'
};

// American roulette has numbers 0, 00, and 1-36
type Stat = {
  number: string;
  count: number;
  color: 'red' | 'black' | 'green';
  isHot: boolean;
  isCold: boolean;
};

type DozenType = '1st' | '2nd' | '3rd' | 'zero';
type StreakType = {
  color: { type: 'red' | 'black', count: number };
  oddEven: { type: 'odd' | 'even' | 'zero', count: number };
  dozen: { type: DozenType, count: number };
};

const generateInitialStats = (): Record<string, Stat> => {
  const stats: Record<string, Stat> = {};
  // Add 0 and 00
  stats['0'] = { number: '0', count: 0, color: 'green', isHot: false, isCold: false };
  stats['00'] = { number: '00', count: 0, color: 'green', isHot: false, isCold: false };
  
  // Add 1-36
  for (let i = 1; i <= 36; i++) {
    // In American roulette:
    // Red numbers: 1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36
    // Black numbers: 2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35
    const isRed = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36].includes(i);
    stats[i.toString()] = { 
      number: i.toString(), 
      count: 0, 
      color: isRed ? 'red' : 'black',
      isHot: false,
      isCold: false
    };
  }
  return stats;
};

// Determine the dozen of a number
const getDozen = (num: string): DozenType => {
  const numVal = parseInt(num);
  if (isNaN(numVal) || numVal === 0) return 'zero';
  if (numVal >= 1 && numVal <= 12) return '1st';
  if (numVal >= 13 && numVal <= 24) return '2nd';
  return '3rd';
};

const initialStreak: StreakType = {
  color: { type: 'red', count: 0 },
  oddEven: { type: 'odd', count: 0 },
  dozen: { type: '1st', count: 0 }
};

const RouletteTracker = () => {
  const [stats, setStats] = useState(generateInitialStats());
  const [totalSpins, setTotalSpins] = useState(0);
  const [history, setHistory] = useState<string[]>([]);
  const [selectedNumber, setSelectedNumber] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [streaks, setStreaks] = useState<StreakType>(initialStreak);
  const [dozenStats, setDozenStats] = useState({
    '1st': 0,
    '2nd': 0,
    '3rd': 0,
    'zero': 0
  });
  
  const [users] = useState([
    { id: 1, username: 'admin', role: ROLES.ADMIN, password: 'admin123' },
    { id: 2, username: 'user1', role: ROLES.USER, password: 'user123' },
    { id: 3, username: 'user2', role: ROLES.USER, password: 'user456' }
  ]);
  
  // Fix: Only run when totalSpins changes to avoid infinite loop
  useEffect(() => {
    if (totalSpins < 10) return; // Need minimum spins for meaningful stats
    
    const expectedFrequency = totalSpins / 38; // 38 numbers in American roulette
    const threshold = expectedFrequency * 0.5; // 50% threshold for hot/cold
    
    const updatedStats = { ...stats };
    
    Object.keys(updatedStats).forEach(num => {
      updatedStats[num].isHot = updatedStats[num].count > (expectedFrequency + threshold);
      updatedStats[num].isCold = updatedStats[num].count < (expectedFrequency - threshold);
    });
    
    setStats(updatedStats);
  }, [totalSpins]); // Remove stats from dependency array
  
  // Add a new spin result
  interface AddSpinFn {
    (number: string): void;
  }

  const addSpin: AddSpinFn = (number) => {
    // Update stats
    const updatedStats: Record<string, Stat> = { ...stats };
    updatedStats[number].count += 1;
    setStats(updatedStats);

    // Update history
    const newHistory = [...history, number];
    setHistory(newHistory);

    // Update total spins
    setTotalSpins(prevSpins => prevSpins + 1);
    
    // Update dozen statistics
    const dozen = getDozen(number);
    setDozenStats(prev => ({
      ...prev,
      [dozen]: prev[dozen] + 1
    }));
    
    // Update streak information
    updateStreaks(number);
  };
  
  // Update streaks based on new spin
  const updateStreaks = (number: string) => {
    const num = parseInt(number);
    const isZero = isNaN(num) || number === '0' || number === '00';
    
    // Determine properties of the new number
    const color = isZero ? 'green' : stats[number].color;
    const oddEven = isZero ? 'zero' : (num % 2 === 1 ? 'odd' : 'even');
    const dozen = getDozen(number);
    
    setStreaks(prevStreaks => {
      // Color streak
      let colorStreak = prevStreaks.color;
      if (color === 'green') {
        colorStreak = { type: 'red', count: 0 }; // Reset on green
      } else if (color === colorStreak.type) {
        colorStreak = { ...colorStreak, count: colorStreak.count + 1 };
      } else {
        colorStreak = { type: color as 'red' | 'black', count: 1 };
      }
      
      // Odd/Even streak
      let oddEvenStreak = prevStreaks.oddEven;
      if (oddEven === 'zero') {
        oddEvenStreak = { type: 'odd', count: 0 }; // Reset on zero
      } else if (oddEven === oddEvenStreak.type) {
        oddEvenStreak = { ...oddEvenStreak, count: oddEvenStreak.count + 1 };
      } else {
        oddEvenStreak = { type: oddEven as 'odd' | 'even', count: 1 };
      }
      
      // Dozen streak
      let dozenStreak = prevStreaks.dozen;
      if (dozen === 'zero') {
        dozenStreak = { type: '1st', count: 0 }; // Reset on zero
      } else if (dozen === dozenStreak.type) {
        dozenStreak = { ...dozenStreak, count: dozenStreak.count + 1 };
      } else {
        dozenStreak = { type: dozen, count: 1 };
      }
      
      return {
        color: colorStreak,
        oddEven: oddEvenStreak,
        dozen: dozenStreak
      };
    });
  };
  
  // Reset all data
  const resetData = () => {
    setStats(generateInitialStats());
    setTotalSpins(0);
    setHistory([]);
    setSelectedNumber(null);
    setStreaks(initialStreak);
    setDozenStats({
      '1st': 0,
      '2nd': 0,
      '3rd': 0,
      'zero': 0
    });
  };
  
  // Calculate some basic statistics
  const calculateStats = () => {
    if (totalSpins === 0) return { red: 0, black: 0, green: 0, odd: 0, even: 0, high: 0, low: 0 };
    
    let redCount = 0;
    let blackCount = 0;
    let greenCount = 0;
    let oddCount = 0;
    let evenCount = 0;
    let highCount = 0;
    let lowCount = 0;
    
    history.forEach(num => {
      const number = stats[num];
      
      if (number.color === 'red') redCount++;
      else if (number.color === 'black') blackCount++;
      else greenCount++;
      
      const numVal = parseInt(num);
      if (!isNaN(numVal)) {
        if (numVal % 2 === 1) oddCount++;
        else evenCount++;
        
        if (numVal >= 1 && numVal <= 18) lowCount++;
        else if (numVal >= 19 && numVal <= 36) highCount++;
      }
    });
    
    return {
      red: (redCount / totalSpins * 100).toFixed(1),
      black: (blackCount / totalSpins * 100).toFixed(1),
      green: (greenCount / totalSpins * 100).toFixed(1),
      odd: (oddCount / totalSpins * 100).toFixed(1),
      even: (evenCount / totalSpins * 100).toFixed(1),
      high: (highCount / totalSpins * 100).toFixed(1),
      low: (lowCount / totalSpins * 100).toFixed(1),
    };
  };
  
  // Get suggestion based on current stats
  const getSuggestion = () => {
    if (totalSpins < 20) {
      return "Need more spins for reliable predictions (at least 20)";
    }
    
    // Find the coldest numbers (least frequent)
    const coldNumbers = Object.values(stats)
      .filter(stat => stat.isCold)
      .sort((a, b) => a.count - b.count)
      .slice(0, 5)
      .map(stat => stat.number);
    
    // Check for recent patterns
    const lastFiveResults = history.slice(-5);
    const uniqueLastFive = [...new Set(lastFiveResults)];
    
    // Check if we've had many reds or blacks in a row
    const lastTenResults = history.slice(-10);
    const redCount = lastTenResults.filter(num => stats[num].color === 'red').length;
    const blackCount = lastTenResults.filter(num => stats[num].color === 'black').length;
    
    // Check dozen patterns
    const dozenCounts = {
      '1st': lastTenResults.filter(num => getDozen(num) === '1st').length,
      '2nd': lastTenResults.filter(num => getDozen(num) === '2nd').length,
      '3rd': lastTenResults.filter(num => getDozen(num) === '3rd').length
    };
    
    const dominantDozen = Object.entries(dozenCounts)
      .sort((a, b) => b[1] - a[1])[0];
    
    let suggestion = "";
    
    // Make suggestions based on patterns
    if (coldNumbers.length > 0) {
      suggestion += `Consider straight bets on cold numbers: ${coldNumbers.join(', ')}. `;
    }
    
    if (uniqueLastFive.length === 5) {
      suggestion += "Recent results show high variation. ";
    } else if (uniqueLastFive.length === 1) {
      suggestion += "Same number repeating! This is rare. ";
    }
    
    // Color streaks
    if (streaks.color.count >= 5) {
      suggestion += `${streaks.color.type.toUpperCase()} has appeared ${streaks.color.count} times in a row - consider betting on ${streaks.color.type === 'red' ? 'BLACK' : 'RED'}. `;
    }
    
    // Dozen streaks
    if (dominantDozen[1] >= 6) {
      const otherDozens = ['1st', '2nd', '3rd'].filter(d => d !== dominantDozen[0]);
      suggestion += `${dominantDozen[0]} dozen is appearing frequently. Consider betting on ${otherDozens.join(' or ')} dozen. `;
    }
    
    if (redCount >= 7) {
      suggestion += "Recent trend shows many reds - black might be due. ";
    } else if (blackCount >= 7) {
      suggestion += "Recent trend shows many blacks - red might be due. ";
    }
    
    if (!suggestion) {
      suggestion = "No strong patterns detected. Consider conservative betting.";
    }
    
    return suggestion;
  };
  
  // Prepare data for visualizations
  const prepareChartData = () => {
    return Object.values(stats).map(item => ({
      name: item.number,
      value: item.count,
      color: item.color,
      isHot: item.isHot,
      isCold: item.isCold
    }));
  };
  
  // Prepare dozen data for visualizations
  const prepareDozenChartData = () => {
    return [
      { name: '1st (1-12)', value: dozenStats['1st'], fill: '#8884d8' },
      { name: '2nd (13-24)', value: dozenStats['2nd'], fill: '#82ca9d' },
      { name: '3rd (25-36)', value: dozenStats['3rd'], fill: '#ffc658' },
      { name: 'Zero/00', value: dozenStats['zero'], fill: '#ff8042' }
    ];
  };
  
  const basicStats = calculateStats();
  const chartData = prepareChartData();
  const dozenChartData = prepareDozenChartData();
  
  // Get simplified decision for regular users
  const getSimplifiedDecision = () => {
    if (totalSpins < 20) {
      return { decision: "Waiting for more data...", confidence: "Low" };
    }
    
    // Analyze recent trends
    const lastTwelveResults = history.slice(-12);
    const redCount = lastTwelveResults.filter(num => stats[num].color === 'red').length;
    const blackCount = lastTwelveResults.filter(num => stats[num].color === 'black').length;
    
    // Find cold numbers
    const coldNumbers = Object.values(stats)
      .filter(stat => stat.isCold)
      .sort((a, b) => a.count - b.count)
      .slice(0, 3);
    
    // Check dozen patterns in last 12 spins
    const dozenCounts = {
      '1st': lastTwelveResults.filter(num => getDozen(num) === '1st').length,
      '2nd': lastTwelveResults.filter(num => getDozen(num) === '2nd').length,
      '3rd': lastTwelveResults.filter(num => getDozen(num) === '3rd').length
    };
    
    const maxDozen = Object.entries(dozenCounts).sort((a, b) => b[1] - a[1])[0];
    const minDozen = Object.entries(dozenCounts).sort((a, b) => a[1] - b[1])[0];
    
    // Make a simple decision based on best pattern
    
    // Strong color streak
    if (streaks.color.count >= 5) {
      return { 
        decision: `Bet on ${streaks.color.type === 'red' ? 'BLACK' : 'RED'}`, 
        confidence: "Medium to High",
        reason: `${streaks.color.type} has appeared ${streaks.color.count} times in a row`
      };
    }
    
    // Strong dozen imbalance
    if (maxDozen[1] >= 6 && minDozen[1] <= 2) {
      return { 
        decision: `Bet on ${minDozen[0]} dozen (${minDozen[0] === '1st' ? '1-12' : minDozen[0] === '2nd' ? '13-24' : '25-36'})`, 
        confidence: "Medium",
        reason: `${minDozen[0]} dozen is due after appearing only ${minDozen[1]} times in last 12 spins`
      };
    }
    
    // Standard red/black imbalance
    if (redCount >= 8) {
      return { 
        decision: "Bet on BLACK", 
        confidence: "Medium",
        reason: "Recent trend shows many reds"
      };
    } else if (blackCount >= 8) {
      return { 
        decision: "Bet on RED", 
        confidence: "Medium",
        reason: "Recent trend shows many blacks"
      };
    } else if (coldNumbers.length > 0) {
      const numbers = coldNumbers.map(n => n.number).join(', ');
      return { 
        decision: `Consider numbers: ${numbers}`, 
        confidence: "Low to Medium",
        reason: "These numbers are appearing less frequently than expected"
      };
    }
    
    return { 
      decision: "No strong recommendation", 
      confidence: "Low",
      reason: "No clear patterns detected" 
    };
  };
  
  // Login handler
  interface User {
    id: number;
    username: string;
    role: string;
    password: string;
  }

  const handleLogin = (username: string, password: string): boolean => {
    const user: User | undefined = users.find(
      (u: User) => u.username === username && u.password === password
    );
    if (user) {
      setCurrentUser(user);
      return true;
    }
    return false;
  };
  
  // Logout handler
  const handleLogout = () => {
    setCurrentUser(null);
  };
  
  // Login component
  const LoginForm = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    
    interface LoginFormEvent extends React.FormEvent<HTMLFormElement> {}

    const handleSubmit = (e: LoginFormEvent): void => {
      e.preventDefault();
      if (handleLogin(username, password)) {
        setError('');
      } else {
        setError('Invalid username or password');
      }
    };
    
    return (
      <div className="flex flex-col h-screen bg-gray-100 p-2 sm:p-4 max-w-6xl mx-auto">
        <div className="bg-indigo-800 text-white p-4 rounded-t-lg">
          <h1 className="text-2xl font-bold">Roulette Prediction System</h1>
          <p className="text-sm">Please log in to continue</p>
        </div>
        
        <div className="flex flex-grow items-center justify-center bg-white rounded-b-lg shadow-lg">
          <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded shadow-md w-80">
            <h2 className="text-xl font-bold mb-4 text-center">Log In</h2>
            
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
                placeholder="Enter your username"
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                required
                placeholder="Enter your password"
                title="Password"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <button
                type="submit"
                className="bg-indigo-700 hover:bg-indigo-800 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
              >
                Sign In
              </button>
            </div>
            
            <div className="mt-4 text-xs text-gray-500">
              <p>Demo accounts:</p>
              <p>Admin: username - admin, password - admin123</p>
              <p>Users: username - user1/user2, password - user123/user456</p>
            </div>
          </form>
        </div>
      </div>
    );
  };
  
  // If no user is logged in, show login form
  if (!currentUser) {
    return <LoginForm />;
  }
  
  // User interface based on role
  return (
    <div className="flex flex-col min-h-screen bg-gray-100 p-2 sm:p-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-indigo-800 text-white p-4 rounded-t-lg flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Roulette Spin Tracker & Analyzer</h1>
          <p className="text-sm">Track spins and analyze patterns for American roulette</p>
        </div>
        <div className="flex items-center mt-2 sm:mt-0">
          <span className="mr-4 text-xs sm:text-sm">
            Logged in as: <strong>{currentUser.username}</strong> ({currentUser.role})
          </span>
          <button 
            onClick={handleLogout}
            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex flex-col flex-grow bg-white rounded-b-lg shadow-lg overflow-hidden">
        {/* Top Section - Number Buttons */}
        <div className="w-full p-4 border-b border-gray-200 bg-gray-50">
          <div className="mb-4">
            <h2 className="text-lg sm:text-xl font-semibold mb-2">Record Spins</h2>
            <p className="text-sm text-gray-600 mb-4">
              Total Spins: <span className="font-bold">{totalSpins}</span> | 
              Last 5: <span className="font-bold">{history.slice(-5).join(', ') || 'None'}</span>
            </p>
            
            {/* Roulette Wheel Number Selection */}
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-1 sm:gap-2 mb-4">
              <button 
                onClick={() => addSpin('0')}
                className="p-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
              >
                0
              </button>
              <button 
                onClick={() => addSpin('00')}
                className="p-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
              >
                00
              </button>
              
              {Array.from({length: 36}, (_, i) => i + 1).map(num => {
                const isRed = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36].includes(num);
                return (
                  <button 
                    key={num}
                    onClick={() => addSpin(num.toString())}
                    className={`p-2 ${isRed ? 'bg-red-600' : 'bg-gray-800'} text-white rounded hover:opacity-80 transition`}
                  >
                    {num}
                  </button>
                );
              })}
            </div>
            
            <button 
              onClick={resetData}
              className="w-full p-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition"
            >
              Reset All Data
            </button>
          </div>
        </div>
        
        {/* Middle Section - Statistics & Recommendations */}
        <div className="flex flex-col md:flex-row">
          {/* Left Column - Statistics */}
          <div className="w-full md:w-1/2 p-4 border-r border-gray-200">
            <h2 className="text-lg sm:text-xl font-semibold mb-4">Statistics</h2>
            
            {/* Basic Statistics */}
            <div className="grid grid-cols-2 gap-2 mb-6">
              <div className="bg-red-100 p-2 rounded">
                <span className="font-semibold">Red:</span> {basicStats.red}%
              </div>
              <div className="bg-gray-800 text-white p-2 rounded">
                <span className="font-semibold">Black:</span> {basicStats.black}%
              </div>
              <div className="bg-green-100 p-2 rounded">
                <span className="font-semibold">Green (0/00):</span> {basicStats.green}%
              </div>
              <div className="bg-blue-100 p-2 rounded">
                <span className="font-semibold">Odd:</span> {basicStats.odd}%
              </div>
              <div className="bg-blue-100 p-2 rounded">
                <span className="font-semibold">Even:</span> {basicStats.even}%
              </div>
              <div className="bg-yellow-100 p-2 rounded">
                <span className="font-semibold">Low (1-18):</span> {basicStats.low}%
              </div>
              <div className="bg-yellow-100 p-2 rounded">
                <span className="font-semibold">High (19-36):</span> {basicStats.high}%
              </div>
            </div>
            
            {/* New Feature: Streak Information */}
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Current Streaks</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="bg-indigo-50 p-2 rounded border border-indigo-100">
                  <h4 className="text-xs font-semibold text-gray-700">Color</h4>
                  <p className="text-lg font-bold">
                    {streaks.color.count > 0 ? 
                      <span className={streaks.color.type === 'red' ? 'text-red-600' : 'text-gray-800'}>
                        {streaks.color.count}x {streaks.color.type}
                      </span> 
                      : 'No streak'}
                  </p>
                </div>
                <div className="bg-indigo-50 p-2 rounded border border-indigo-100">
                  <h4 className="text-xs font-semibold text-gray-700">Odd/Even</h4>
                  <p className="text-lg font-bold">
                    {streaks.oddEven.count > 0 ? 
                      `${streaks.oddEven.count}x ${streaks.oddEven.type}` 
                      : 'No streak'}
                  </p>
                </div>
                <div className="bg-indigo-50 p-2 rounded border border-indigo-100">
                  <h4 className="text-xs font-semibold text-gray-700">Dozen</h4>
                  <p className="text-lg font-bold">
                    {streaks.dozen.count > 0 ? 
                      `${streaks.dozen.count}x ${streaks.dozen.type}` 
                      : 'No streak'}
                  </p>
                </div>
              </div>
            </div>
            
            {/* New Feature: Dozen Statistics */}
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Dozen Statistics</h3>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-purple-100 p-2 rounded">
                  <h4 className="text-xs font-semibold text-center">1st (1-12)</h4>
                  <p className="text-center font-bold">{totalSpins ? ((dozenStats['1st'] / totalSpins) * 100).toFixed(1) : 0}%</p>
                  <p className="text-xs text-center">({dozenStats['1st']} spins)</p>
                </div>
                <div className="bg-green-100 p-2 rounded">
                  <h4 className="text-xs font-semibold text-center">2nd (13-24)</h4>
                  <p className="text-center font-bold">{totalSpins ? ((dozenStats['2nd'] / totalSpins) * 100).toFixed(1) : 0}%</p>
                  <p className="text-xs text-center">({dozenStats['2nd']} spins)</p>
                </div>
                <div className="bg-yellow-100 p-2 rounded">
                  <h4 className="text-xs font-semibold text-center">3rd (25-36)</h4>
                  <p className="text-center font-bold">{totalSpins ? ((dozenStats['3rd'] / totalSpins) * 100).toFixed(1) : 0}%</p>
                  <p className="text-xs text-center">({dozenStats['3rd']} spins)</p>
                </div>
              </div>
            </div>
            
            {/* Last 12 Spins (New Requirement) */}
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Last 12 Spins (Newest First)</h3>
              <div className="flex flex-wrap gap-1 sm:gap-2">
                {history.slice(-12).reverse().map((num, index) => {
                  const color = stats[num].color;
                  return (
                    <div 
                      key={index} 
                      className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full ${
                        color === 'red' ? 'bg-red-600' : 
                        color === 'black' ? 'bg-gray-800' : 'bg-green-500'
                      } text-white text-xs font-bold`}
                    >
                      {num}
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Different content based on user role */}
            {currentUser.role === ROLES.ADMIN ? (
              // Admin sees full strategy suggestions
              <div className="bg-indigo-50 p-4 rounded border border-indigo-200">
                <h2 className="text-lg font-semibold mb-2">Strategy Analysis (Admin View)</h2>
                <p className="text-sm mb-3">{getSuggestion()}</p>
                
                <h3 className="font-semibold text-sm mb-1">User Decision Summary:</h3>
                <div className="bg-white p-2 rounded border border-gray-200 mb-2">
                  <p className="font-bold">{getSimplifiedDecision().decision}</p>
                  <p className="text-xs text-gray-600">
                    Confidence: {getSimplifiedDecision().confidence} 
                    <br />Reason: {getSimplifiedDecision().reason}
                  </p>
                </div>
                <p className="text-xs text-gray-500 italic">This simplified decision is what regular users are seeing</p>
              </div>
            ) : (
              // Regular users see simplified decision
              <div className="bg-indigo-50 p-4 rounded border border-indigo-200">
                <h2 className="text-lg font-semibold mb-2">Betting Recommendation</h2>
                <div className="bg-white p-4 rounded shadow-inner">
                  <p className="text-xl sm:text-2xl font-bold text-center mb-2">{getSimplifiedDecision().decision}</p>
                  <div className="flex justify-between text-sm">
                    <span>Confidence: <span className="font-semibold">{getSimplifiedDecision().confidence}</span></span>
                    <span>Based on {totalSpins} spins</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Right Column - Visualizations */}
          <div className="w-full md:w-1/2 p-4">
            {currentUser.role === ROLES.ADMIN ? (
              // Admin sees full analytics
              <>
                <h2 className="text-lg sm:text-xl font-semibold mb-4">Number Frequency Analysis</h2>
                
                {/* Frequency Chart */}
                <div className="h-64 mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.sort((a, b) => a.name.localeCompare(b.name, 'en', {numeric: true}))}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value">
                        {chartData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.isHot ? '#f97316' : entry.isCold ? '#6366f1' : entry.color} 
                            className="cursor-pointer"
                            onClick={() => setSelectedNumber(entry.name)}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="flex justify-center space-x-4 text-sm">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-orange-500 rounded-full mr-1"></div>
                      <span>Hot Numbers</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-indigo-500 rounded-full mr-1"></div>
                      <span>Cold Numbers</span>
                    </div>
                  </div>
                </div>
                
                {/* Dozen Distribution Pie Chart */}
                <div className="mb-6">
                  <h3 className="font-semibold mb-2">Dozen Distribution</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={dozenChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({name, percent}) => `${name}: ${(percent * 100).toFixed(1)}%`}
                        >
                          {dozenChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                {/* Selected Number Detail */}
                {selectedNumber && (
                  <div className="bg-gray-100 p-4 rounded mb-6">
                    <h3 className="font-semibold">Number {selectedNumber} Details</h3>
                    <p>Occurrences: {stats[selectedNumber].count} ({totalSpins > 0 ? ((stats[selectedNumber].count / totalSpins) * 100).toFixed(1) : 0}%)</p>
                    <p>Expected: {(totalSpins / 38).toFixed(1)} times ({(100 / 38).toFixed(1)}%)</p>
                    <p>Status: {
                      stats[selectedNumber].isHot ? 'Hot (appearing more than expected)' : 
                      stats[selectedNumber].isCold ? 'Cold (appearing less than expected)' : 
                      'Normal frequency'
                    }</p>
                  </div>
                )}
              </>
            ) : (
              // Regular users see simplified visualization
              <>
                <h2 className="text-lg sm:text-xl font-semibold mb-4">Recent Trends</h2>
                
                {/* Simplified visualization for regular users */}
                <div className="bg-white p-4 rounded shadow border border-gray-200 mb-6">
                  <h3 className="font-semibold mb-3">Color Distribution</h3>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-red-50 p-3 rounded border border-red-200">
                      <h4 className="font-semibold text-center mb-1">Red</h4>
                      <p className="text-2xl text-center">{basicStats.red}%</p>
                    </div>
                    <div className="bg-gray-800 p-3 rounded border border-gray-700 text-white">
                      <h4 className="font-semibold text-center mb-1">Black</h4>
                      <p className="text-2xl text-center">{basicStats.black}%</p>
                    </div>
                  </div>
                </div>
                
                {/* Dozen Distribution for Users */}
                <div className="bg-white p-4 rounded shadow border border-gray-200 mb-6">
                  <h3 className="font-semibold mb-3">Dozen Distribution</h3>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-purple-100 p-3 rounded border border-purple-200 text-center">
                      <h4 className="text-xs font-semibold">1st Dozen</h4>
                      <p className="text-xl">{totalSpins ? ((dozenStats['1st'] / totalSpins) * 100).toFixed(1) : 0}%</p>
                    </div>
                    <div className="bg-green-100 p-3 rounded border border-green-200 text-center">
                      <h4 className="text-xs font-semibold">2nd Dozen</h4>
                      <p className="text-xl">{totalSpins ? ((dozenStats['2nd'] / totalSpins) * 100).toFixed(1) : 0}%</p>
                    </div>
                    <div className="bg-yellow-100 p-3 rounded border border-yellow-200 text-center">
                      <h4 className="text-xs font-semibold">3rd Dozen</h4>
                      <p className="text-xl">{totalSpins ? ((dozenStats['3rd'] / totalSpins) * 100).toFixed(1) : 0}%</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-indigo-50 p-4 rounded border border-indigo-200">
                  <h3 className="font-semibold mb-2">Important Notice</h3>
                  <p className="text-sm">
                    This is a prediction tool, not a guarantee of winning. Roulette is primarily a game of chance, 
                    and past results don't guarantee future outcomes. Please gamble responsibly.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouletteTracker;
