"use client";
import React, { useState, useEffect } from "react";
import {
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// User roles and authentication
const ROLES = {
  ADMIN: "admin",
  USER: "user",
};

// European roulette has numbers 0-36 (just one zero)
type Stat = {
  number: string;
  count: number;
  color: "red" | "black" | "green";
};

// Define a street (3 consecutive numbers in a row)
type Street = {
  streetNumber: number;
  numbers: number[];
  appearedInLast10: boolean;
  appearancesInLast12: number;
  multipleAppearances: boolean;
};

type StreetAnalysis = {
  streetsNotInLast10: Street[];
  streetsNotInLast12: Street[];
  streetsMultipleInLast12: Street[];
  streetsSingleInLast12: Street[];
  allStreetStats: Street[];
};

// Define red numbers in European roulette
const RED_NUMBERS = [
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
];

const generateInitialStats = (): Record<string, Stat> => {
  const stats: Record<string, Stat> = {};
  stats["0"] = { number: "0", count: 0, color: "green" };
  for (let i = 1; i <= 36; i++) {
    const isRed = RED_NUMBERS.includes(i);
    stats[i.toString()] = {
      number: i.toString(),
      count: 0,
      color: isRed ? "red" : "black",
    };
  }
  return stats;
};

// Analyze streets based on spin history
const analyzeStreets = (history: string[]): StreetAnalysis => {
  const last12 = history.slice(-12);
  const last10 = history.slice(-10);
  const last12Numbers = last12
    .map((num) => parseInt(num))
    .filter((num) => !isNaN(num) && num > 0);
  const last10Numbers = last10
    .map((num) => parseInt(num))
    .filter((num) => !isNaN(num) && num > 0);
  const streetStats = STREETS.map((street, index) => {
    const streetNumber = index + 1;
    const appearedInLast10 = last10Numbers.some((num) => street.includes(num));
    const appearancesInLast12 = last12Numbers.filter((num) =>
      street.includes(num)
    ).length;
    return {
      streetNumber,
      numbers: street,
      appearedInLast10,
      appearancesInLast12,
      multipleAppearances: appearancesInLast12 >= 2,
    };
  });
  return {
    streetsNotInLast10: streetStats.filter((s) => !s.appearedInLast10),
    streetsNotInLast12: streetStats.filter((s) => s.appearancesInLast12 === 0),
    streetsMultipleInLast12: streetStats.filter((s) => s.multipleAppearances),
    streetsSingleInLast12: streetStats.filter((s) => s.appearancesInLast12 === 1),
    allStreetStats: streetStats,
  };
};

// Define all streets in European roulette
const STREETS = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
  [10, 11, 12],
  [13, 14, 15],
  [16, 17, 18],
  [19, 20, 21],
  [22, 23, 24],
  [25, 26, 27],
  [28, 29, 30],
  [31, 32, 33],
  [34, 35, 36],
];

const RouletteTracker = () => {
  const [stats, setStats] = useState(generateInitialStats());
  const [totalSpins, setTotalSpins] = useState(0);
  const [history, setHistory] = useState<string[]>([]);
  const [selectedNumber, setSelectedNumber] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [streetAnalysis, setStreetAnalysis] = useState<StreetAnalysis>({
    streetsNotInLast10: [],
    streetsNotInLast12: [],
    streetsMultipleInLast12: [],
    streetsSingleInLast12: [],
    allStreetStats: [],
  });

  const [users] = useState([
    { id: 1, username: "admin", role: ROLES.ADMIN, password: "admin123" },
    { id: 2, username: "user1", role: ROLES.USER, password: "user123" },
    { id: 3, username: "user2", role: ROLES.USER, password: "user456" },
  ]);

  useEffect(() => {
    if (history.length > 0) {
      const analysis = analyzeStreets(history);
      setStreetAnalysis(analysis);
    }
  }, [history]);

  interface AddSpinFn {
    (number: string): void;
  }

  const addSpin: AddSpinFn = (number) => {
    const updatedStats: Record<string, Stat> = { ...stats };
    updatedStats[number].count += 1;
    setStats(updatedStats);
    setHistory((prevHistory) => [...prevHistory, number]);
    setTotalSpins((prevSpins) => prevSpins + 1);
  };

  const resetData = () => {
    setStats(generateInitialStats());
    setTotalSpins(0);
    setHistory([]);
    setSelectedNumber(null);
    setStreetAnalysis({
      streetsNotInLast10: [],
      streetsNotInLast12: [],
      streetsMultipleInLast12: [],
      streetsSingleInLast12: [],
      allStreetStats: [],
    });
  };

  const calculateStats = () => {
    if (totalSpins === 0)
      return { red: 0, black: 0, green: 0, odd: 0, even: 0, high: 0, low: 0 };

    let redCount = 0;
    let blackCount = 0;
    let greenCount = 0;
    let oddCount = 0;
    let evenCount = 0;
    let highCount = 0;
    let lowCount = 0;

    history.forEach((num) => {
      const number = stats[num];
      if (number.color === "red") redCount++;
      else if (number.color === "black") blackCount++;
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
      red: ((redCount / totalSpins) * 100).toFixed(1),
      black: ((blackCount / totalSpins) * 100).toFixed(1),
      green: ((greenCount / totalSpins) * 100).toFixed(1),
      odd: ((oddCount / totalSpins) * 100).toFixed(1),
      even: ((evenCount / totalSpins) * 100).toFixed(1),
      high: ((highCount / totalSpins) * 100).toFixed(1),
      low: ((lowCount / totalSpins) * 100).toFixed(1),
    };
  };

  const getStrategyDetails = (strategy: number) => {
    if (totalSpins < 12) {
      return {
        name: `Strategy ${strategy}`,
        streets: [],
        numbers: [],
        description: "Need at least 12 spins for reliable predictions",
        confidence: "Low",
      };
    }

    if (strategy === 1) {
      const streets = streetAnalysis.streetsNotInLast12.slice(0, 3);
      return {
        name: "Strategy 1",
        streets: streets.map((s) => s.streetNumber),
        numbers: streets.flatMap((s) => s.numbers),
        description: "Bet on streets that haven't appeared in the last 12 spins",
        confidence: "Medium",
      };
    } else if (strategy === 2) {
      const streets = streetAnalysis.streetsNotInLast10.slice(0, 3);
      return {
        name: "Strategy 2",
        streets: streets.map((s) => s.streetNumber),
        numbers: streets.flatMap((s) => s.numbers),
        description: "Bet on streets that haven't appeared in the last 10 spins",
        confidence: "Low to Medium",
      };
    } else {
      const streets = streetAnalysis.streetsSingleInLast12.slice(0, 3);
      return {
        name: "Strategy 3",
        streets: streets.map((s) => s.streetNumber),
        numbers: streets.flatMap((s) => s.numbers),
        description: "Bet on streets that appeared exactly once in the last 12 spins",
        confidence: "Low",
      };
    }
  };

  const prepareChartData = () => {
    return Object.values(stats).map((item) => ({
      name: item.number,
      value: item.count,
      color: item.color,
    }));
  };

  const basicStats = calculateStats();
  const chartData = prepareChartData();

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

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const LoginForm = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    interface LoginFormEvent extends React.FormEvent<HTMLFormElement> { }

    const handleSubmit = (e: LoginFormEvent): void => {
      e.preventDefault();
      if (handleLogin(username, password)) {
        setError("");
      } else {
        setError("Invalid username or password");
      }
    };

    return (
      <div className="flex flex-col h-screen bg-green-800 p-2 sm:p-4 max-w-6xl mx-auto">
        <div className="bg-green-900 text-white p-4 rounded-t-lg">
          <h1 className="text-2xl font-bold">
            European Roulette Street Tracker
          </h1>
          <p className="text-sm">Please log in to continue</p>
        </div>
        <div className="flex justify-center items-center min-h-screen bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
        <h1 className="text-6xl md:text-8xl font-bold text-white text-center animate-pulse">
          Coming Soon
        </h1>
      </div>
        {/* <div className="flex flex-grow items-center justify-center bg-white rounded-b-lg shadow-lg">
          <form
            onSubmit={handleSubmit}
            className="bg-white p-6 sm:p-8 rounded shadow-md w-80"
          >
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
                className="bg-green-700 hover:bg-green-800 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
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
        </div> */}
      </div>
    );
  };

  if (!currentUser) {
    return <LoginForm />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-green-800 p-2 sm:p-4 max-w-6xl mx-auto">
      <div className="bg-green-900 text-white p-4 rounded-t-lg flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">
            European Roulette Street Tracker
          </h1>
          <p className="text-sm">
            Track street patterns for European roulette (single zero)
          </p>
        </div>
        <div className="flex items-center mt-2 sm:mt-0">
          <span className="mr-4 text-xs sm:text-sm">
            Logged in as: <strong>{currentUser.username}</strong> (
            {currentUser.role})
          </span>
          <button
            onClick={handleLogout}
            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </div>
      <div className="flex flex-col flex-grow bg-white rounded-b-lg shadow-lg overflow-hidden">
        <div className="w-full p-4 border-b border-gray-200 bg-green-100">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">
            European Roulette Table
          </h2>
          <div className="w-full max-w-full">
            <div className="w-full border-4 border-green-800 rounded-lg p-3 bg-green-7
            00 relative">
              {/* Mobile layout: Vertical table */}
              <div className="sm:hidden w-full">
                {/* Zero button */}
                <div className="w-full flex justify-center mb-2">
                  <button
                    onClick={() => addSpin("0")}
                    className="w-16 h-16 flex items-center justify-center bg-green-600 text-white font-bold rounded-sm hover:bg-opacity-80 active:bg-opacity-70 transition border border-white text-xl"
                  >
                    0
                  </button>
                </div>
                {/* Main grid 1-36 vertical */}
                <div className="grid grid-cols-3 gap-1">
                  {Array.from({ length: 12 }).map((_, rowIndex) => {
                    const colNums = [
                      3 * rowIndex + 3, // Third column (3, 6, 9...)
                      3 * rowIndex + 2, // Second column (2, 5, 8...)
                      3 * rowIndex + 1, // First column (1, 4, 7...)
                    ];
                    return colNums.map((num) => (
                      <button
                        key={num}
                        onClick={() => addSpin(num.toString())}
                        className={`w-full h-12 flex items-center justify-center ${RED_NUMBERS.includes(num) ? "bg-red-600" : "bg-black"
                          } text-white font-bold rounded-sm hover:bg-opacity-80 active:bg-opacity-70 transition border border-white`}
                      >
                        {num}
                      </button>
                    ));
                  })}
                </div>
                {/* Dozens */}
                <div className="grid grid-cols-1 gap-1 mt-2">
                  <div className="bg-green-600 text-white text-center p-2 rounded border border-white">
                    <span className="font-bold">1st Dozen</span>
                    <div className="text-xs">(1-12)</div>
                  </div>
                  <div className="bg-green-600 text-white text-center p-2 rounded border border-white">
                    <span className="font-bold">2nd Dozen</span>
                    <div className="text-xs">(13-24)</div>
                  </div>
                  <div className="bg-green-600 text-white text-center p-2 rounded border border-white">
                    <span className="font-bold">3rd Dozen</span>
                    <div className="text-xs">(25-36)</div>
                  </div>
                </div>
                {/* Additional betting options */}
                <div className="grid grid-cols-2 gap-1 mt-2">
                  <div className="bg-green-600 text-white text-center p-2 rounded border border-white">
                    <span className="font-bold">1-18</span>
                  </div>
                  <div className="bg-green-600 text-white text-center p-2 rounded border border-white">
                    <span className="font-bold">19-36</span>
                  </div>
                  <div className="bg-green-600 text-white text-center p-2 rounded border border-white">
                    <span className="font-bold">EVEN</span>
                  </div>
                  <div className="bg-green-600 text-white text-center p-2 rounded border border-white">
                    <span className="font-bold">ODD</span>
                  </div>
                  <div className="bg-red-600 text-white text-center p-2 rounded border border-white">
                    <span className="font-bold">RED</span>
                  </div>
                  <div className="bg-black text-white text-center p-2 rounded border border-white">
                    <span className="font-bold">BLACK</span>
                  </div>
                </div>
              </div>
              {/* Desktop layout: Horizontal table */}
              <div className="hidden sm:block">
                <div className="flex">
                  <div className="mr-1">
                    <button
                      onClick={() => addSpin("0")}
                      className="w-12 h-36 flex items-center justify-center bg-green-600 text-white font-bold rounded-sm hover:bg-green-700 transition border border-white"
                    >
                      0
                    </button>
                  </div>
                  <div className="grid grid-cols-12 gap-1 flex-1">
                    {[3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36].map(
                      (num) => (
                        <button
                          key={num}
                          onClick={() => addSpin(num.toString())}
                          className={`w-12 h-12 flex items-center justify-center ${RED_NUMBERS.includes(num) ? "bg-red-600" : "bg-black"
                            } text-white font-bold rounded-sm hover:bg-opacity-80 transition border border-white`}
                        >
                          {num}
                        </button>
                      )
                    )}
                    {[2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35].map(
                      (num) => (
                        <button
                          key={num}
                          onClick={() => addSpin(num.toString())}
                          className={`w-12 h-12 flex items-center justify-center ${RED_NUMBERS.includes(num) ? "bg-red-600" : "bg-black"
                            } text-white font-bold rounded-sm hover:bg-opacity-80 transition border border-white`}
                        >
                          {num}
                        </button>
                      )
                    )}
                    {[1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34].map(
                      (num) => (
                        <button
                          key={num}
                          onClick={() => addSpin(num.toString())}
                          className={`w-12 h-12 flex items-center justify-center ${RED_NUMBERS.includes(num) ? "bg-red-600" : "bg-black"
                            } text-white font-bold rounded-sm hover:bg-opacity-80 transition border border-white`}
                        >
                          {num}
                        </button>
                      )
                    )}
                  </div>
                </div>
                <div className="flex mt-2">
                  <div className="w-12 mr-1"></div>
                  <div className="grid grid-cols-12 gap-1 flex-1">
                    <div className="col-span-4 bg-green-600 text-white text-center p-2 rounded border border-white">
                      <span className="font-bold">1st Dozen</span>
                      <div className="text-xs">(1-12)</div>
                    </div>
                    <div className="col-span-4 bg-green-600 text-white text-center p-2 rounded border border-white">
                      <span className="font-bold">2nd Dozen</span>
                      <div className="text-xs">(13-24)</div>
                    </div>
                    <div className="col-span-4 bg-green-600 text-white text-center p-2 rounded border border-white">
                      <span className="font-bold">3rd Dozen</span>
                      <div className="text-xs">(25-36)</div>
                    </div>
                  </div>
                </div>
                <div className="flex mt-2">
                  <div className="w-12 mr-1"></div>
                  <div className="grid grid-cols-12 gap-1 flex-1">
                    <div className="col-span-2 bg-green-600 text-white text-center p-2 rounded border border-white">
                      <span className="font-bold">1 to 18</span>
                    </div>
                    <div className="col-span-2 bg-green-600 text-white text-center p-2 rounded border border-white">
                      <span className="font-bold">EVEN</span>
                    </div>
                    <div className="col-span-2 bg-red-600 text-white text-center p-2 rounded border border-white">
                      <span className="font-bold">RED</span>
                    </div>
                    <div className="col-span-2 bg-black text-white text-center p-2 rounded border border-white">
                      <span className="font-bold">BLACK</span>
                    </div>
                    <div className="col-span-2 bg-green-600 text-white text-center p-2 rounded border border-white">
                      <span className="font-bold">ODD</span>
                    </div>
                    <div className="col-span-2 bg-green-600 text-white text-center p-2 rounded border border-white">
                      <span className="font-bold">19 to 36</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={resetData}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition font-bold border-2 border-gray-400"
                >
                  Reset Data
                </button>
              </div>
            </div>
          </div>
        </div>
        {currentUser.role === ROLES.ADMIN ? (
          <div className="w-full p-4 border-b border-gray-200 bg-green-50">
            <div className="mb-4">
              <h2 className="text-lg sm:text-xl font-semibold mb-2">
                Street Information
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Total Spins: <span className="font-bold">{totalSpins}</span> |
                Last 5:{" "}
                <span className="font-bold">
                  {history.slice(-5).join(", ") || "None"}
                </span>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                {STREETS.map((street, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded border ${streetAnalysis.streetsNotInLast12.some(
                      (s) => s.streetNumber === index + 1
                    )
                        ? "bg-green-100 border-green-300"
                        : streetAnalysis.streetsMultipleInLast12.some(
                          (s) => s.streetNumber === index + 1
                        )
                          ? "bg-red-100 border-red-300"
                          : streetAnalysis.streetsNotInLast10.some(
                            (s) => s.streetNumber === index + 1
                          )
                            ? "bg-yellow-100 border-yellow-300"
                            : "bg-gray-100 border-gray-300"
                      }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Street {index + 1}</span>
                      <span className="text-sm">{street.join("-")}</span>
                    </div>
                    <div className="text-xs mt-1">
                      {streetAnalysis.streetsNotInLast12.some(
                        (s) => s.streetNumber === index + 1
                      )
                        ? "⭐ Missing in last 12 spins"
                        : streetAnalysis.streetsMultipleInLast12.some(
                          (s) => s.streetNumber === index + 1
                        )
                          ? "⚠️ Multiple in last 12 spins"
                          : streetAnalysis.streetsNotInLast10.some(
                            (s) => s.streetNumber === index + 1
                          )
                            ? "🔍 Missing in last 10 spins"
                            : "Recently appeared"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Last 12 Spins (Newest First)</h3>
              <div className="flex flex-wrap gap-1 sm:gap-2">
                {history
                  .slice(-12)
                  .reverse()
                  .map((num, index) => {
                    const color = stats[num].color;
                    return (
                      <div
                        key={index}
                        className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full ${color === "red"
                            ? "bg-red-600"
                            : color === "black"
                              ? "bg-black"
                              : "bg-green-600"
                          } text-white text-xs font-bold`}
                      >
                        {num}
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full p-4 border-b border-gray-200 bg-green-50">
            <div className="mb-4">
              <h2 className="text-lg sm:text-xl font-semibold mb-2">
                Street Information
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Total Spins: <span className="font-bold">{totalSpins}</span> |
                Last 5:{" "}
                <span className="font-bold">
                  {history.slice(-5).join(", ") || "None"}
                </span>
              </p>
            </div>
          </div>
        )}
        <div className="flex flex-col md:flex-row p-4">
          <div className="w-full md:w-1/2 md:pr-4 mb-4 md:mb-0">
            {currentUser.role === ROLES.ADMIN ? (
              <div className="bg-green-50 p-4 rounded border border-green-200">
                <h2 className="text-lg font-semibold mb-2">
                  Strategy Analysis (Admin View)
                </h2>
                {[1, 2, 3].map((strategy) => {
                  const details = getStrategyDetails(strategy);
                  return (
                    <div
                      key={strategy}
                      className="mb-4 p-3 bg-white rounded border border-gray-200"
                    >
                      <h3 className="font-semibold text-sm mb-1">
                        {details.name}
                      </h3>
                      <p className="text-sm mb-2">{details.description}</p>
                      <p className="text-sm">
                        <strong>Streets:</strong>{" "}
                        {details.streets.length > 0
                          ? details.streets.join(", ")
                          : "None"}
                      </p>
                      <p className="text-sm">
                        <strong>Numbers:</strong>{" "}
                        {details.numbers.length > 0
                          ? details.numbers.join(", ")
                          : "None"}
                      </p>
                      <p className="text-xs text-gray-600">
                        Confidence: {details.confidence}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-green-50 p-4 rounded border border-green-200">
                <h2 className="text-lg font-semibold mb-2">
                  Betting Strategies
                </h2>
                {[1, 2, 3].map((strategy) => {
                  const details = getStrategyDetails(strategy);
                  return (
                    <div
                      key={strategy}
                      className="mb-4 p-3 bg-white rounded border border-gray-200"
                    >
                      <h3 className="font-semibold text-sm mb-1">
                        {details.name}
                      </h3>
                      <p className="text-sm">
                        <strong>Streets to Play:</strong>{" "}
                        {details.streets.length > 0
                          ? details.streets.join(", ")
                          : "None"}
                      </p>
                      <p className="text-sm">
                        <strong>Numbers to Play:</strong>{" "}
                        {details.numbers.length > 0
                          ? details.numbers.join(", ")
                          : "None"}
                      </p>
                      <p className="text-xs text-gray-600">
                        Confidence: {details.confidence}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Street Statistics</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="bg-green-100 p-2 rounded border border-green-200">
                  <h4 className="text-sm font-medium">
                    Missing in Last 12 Spins
                  </h4>
                  <p className="text-xl font-bold">
                    {streetAnalysis.streetsNotInLast12.length}
                  </p>
                  <p className="text-xs text-gray-600">Out of 12 streets</p>
                </div>
                <div className="bg-yellow-100 p-2 rounded border border-yellow-200">
                  <h4 className="text-sm font-medium">
                    Missing in Last 10 Spins
                  </h4>
                  <p className="text-xl font-bold">
                    {streetAnalysis.streetsNotInLast10.length}
                  </p>
                  <p className="text-xs text-gray-600">Out of 12 streets</p>
                </div>
                <div className="bg-red-100 p-2 rounded border border-red-200">
                  <h4 className="text-sm font-medium">
                    Multiple in Last 12 Spins
                  </h4>
                  <p className="text-xl font-bold">
                    {streetAnalysis.streetsMultipleInLast12.length}
                  </p>
                  <p className="text-xs text-gray-600">Streets with 2+ hits</p>
                </div>
              </div>
            </div>
          </div>
          <div className="w-full md:w-1/2 md:pl-4">
            {currentUser.role === ROLES.ADMIN ? (
              <>
                <h3 className="font-semibold mb-2">Basic Statistics</h3>
                <div className="grid grid-cols-2 gap-2 mb-6">
                  <div className="bg-red-100 p-2 rounded">
                    <span className="font-semibold">Red:</span>{" "}
                    {basicStats.red}%
                  </div>
                  <div className="bg-gray-800 text-white p-2 rounded">
                    <span className="font-semibold">Black:</span>{" "}
                    {basicStats.black}%
                  </div>
                  <div className="bg-green-100 p-2 rounded">
                    <span className="font-semibold">Green (0):</span>{" "}
                    {basicStats.green}%
                  </div>
                  <div className="bg-blue-100 p-2 rounded">
                    <span className="font-semibold">Odd:</span> {basicStats.odd}%
                  </div>
                  <div className="bg-blue-100 p-2 rounded">
                    <span className="font-bold">Even:</span> {basicStats.even}%
                  </div>
                  <div className="bg-yellow-100 p-2 rounded">
                    <span className="font-semibold">Low (1-18):</span>{" "}
                    {basicStats.low}%
                  </div>
                  <div className="bg-yellow-100 p-2 rounded">
                    <span className="font-semibold">High (19-36):</span>{" "}
                    {basicStats.high}%
                  </div>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData.sort(
                        (a, b) => parseInt(a.name) - parseInt(b.name)
                      )}
                    >
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value">
                        {chartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              entry.color === "red"
                                ? "#dc2626"
                                : entry.color === "black"
                                  ? "#1f2937"
                                  : "#16a34a"
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            ) : (
              <>
                <h3 className="font-semibold mb-2">Street Betting Guide</h3>
                <div className="bg-white p-4 rounded border border-gray-200 mb-4">
                  <p className="text-xs text-gray-500">
                    <strong>Street bet:</strong> A bet on three consecutive
                    numbers in a horizontal line (e.g., 1-2-3 is Street 1).
                    <br />
                    <strong>Payout:</strong> 11 to 1
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded border border-green-200">
                  <h3 className="font-semibold mb-2">Important Notice</h3>
                  <p className="text-sm">
                    This is a prediction tool, not a guarantee of winning.
                    Roulette is primarily a game of chance, and past results
                    don't guarantee future outcomes. Please gamble responsibly.
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
