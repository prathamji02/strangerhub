import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';

const ActivityGraphModal = ({ isOpen, onClose }) => {
    const [allData, setAllData] = useState([]); // Stores data for the whole week
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());

    useEffect(() => {
        if (isOpen) {
            fetchActivityStats();
            setSelectedDate(new Date()); // Reset to today on open
        }
    }, [isOpen]);

    const fetchActivityStats = async () => {
        try {
            setLoading(true);
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

            let rawData = [];

            try {
                const response = await axios.get(`${API_URL}/api/activity/stats`);
                if (response.data && response.data.length > 0) {
                    rawData = response.data.map(item => ({
                        count: item.count,
                        timestamp: new Date(item.time).getTime()
                    }));
                }
            } catch (err) {
                console.warn("API fetch failed, falling back to mock data");
            }

            if (rawData.length === 0) {
                // No data available - show empty state instead of synthetic data
                // rawData remains empty
            }

            setAllData(rawData);
        } catch (error) {
            console.error("Failed to fetch activity stats", error);
        } finally {
            setLoading(false);
        }
    };

    // Filter data for the selected date and fill missing hours
    const dailyData = useMemo(() => {
        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999);

        // create a map of hours 0-23 initialized to 0
        const hoursMap = new Map();
        for (let i = 0; i < 24; i++) {
            hoursMap.set(i, 0);
        }

        // Fill with actual data
        allData.forEach(item => {
            const date = new Date(item.timestamp);
            if (date >= startOfDay && date <= endOfDay) {
                hoursMap.set(date.getHours(), item.count);
            }
        });

        // Convert to array
        return Array.from(hoursMap.entries()).map(([hour, count]) => ({
            hourLabel: `${hour}:00`,
            count,
            hour // for sorting if needed, map order is insertion order usually but better safe
        }));

    }, [allData, selectedDate]);

    const minDate = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        d.setHours(0, 0, 0, 0);
        return d;
    }, []);

    const isMinDateReached = (date) => {
        const current = new Date(date);
        current.setHours(0, 0, 0, 0);
        return current <= minDate;
    };

    const handlePrevDay = () => {
        const newDate = new Date(selectedDate);
        newDate.setDate(selectedDate.getDate() - 1);
        if (newDate >= minDate) {
            setSelectedDate(newDate);
        }
    };

    const handleNextDay = () => {
        const newDate = new Date(selectedDate);
        newDate.setDate(selectedDate.getDate() + 1);
        const today = new Date();
        if (newDate <= today) {
            setSelectedDate(newDate);
        }
    };

    const isToday = (date) => {
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-[#1a1a1a] border border-white/10 p-3 rounded-lg shadow-xl backdrop-blur-md">
                    <p className="text-gray-300 text-sm mb-1">{label}</p>
                    <p className="text-blue-400 font-bold text-lg">
                        {payload[0].value} <span className="text-xs font-normal text-gray-500">online</span>
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className="relative w-full max-w-4xl bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        {/* Header */}
                        <div className="p-4 md:p-6 border-b border-white/5 flex flex-col md:flex-row justify-between items-center bg-gradient-to-r from-blue-900/10 to-purple-900/10 gap-4">
                            <div className="w-full md:w-auto flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 md:w-6 md:h-6 text-blue-400">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Activity Trends
                                    </h2>
                                    <p className="text-gray-400 text-xs md:text-sm mt-1">
                                        Hourly user traffic
                                    </p>
                                </div>
                                {/* Mobile Close Button (Top Right) */}
                                <button
                                    onClick={onClose}
                                    className="md:hidden p-2 rounded-full hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Date Navigation */}
                            <div className="flex items-center justify-between w-full md:w-auto gap-4 bg-white/5 rounded-xl md:rounded-full px-4 py-3 md:py-2 border border-white/5">
                                <button
                                    onClick={handlePrevDay}
                                    disabled={isMinDateReached(selectedDate)}
                                    className={`p-2 md:p-1 transition-colors active:scale-95 ${isMinDateReached(selectedDate) ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:text-white'}`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 md:w-5 md:h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                                    </svg>
                                </button>
                                <span className="text-sm font-medium text-white min-w-[100px] text-center">
                                    {isToday(selectedDate) ? "Today" : selectedDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                </span>
                                <button
                                    onClick={handleNextDay}
                                    disabled={isToday(selectedDate)}
                                    className={`p-2 md:p-1 transition-colors active:scale-95 ${isToday(selectedDate) ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:text-white'}`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 md:w-5 md:h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                    </svg>
                                </button>
                            </div>

                            {/* Desktop Close Button */}
                            <button
                                onClick={onClose}
                                className="hidden md:block p-2 rounded-full hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-4 md:p-6 min-h-[300px] md:min-h-[400px] flex-1">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center h-[250px] md:h-[300px] space-y-4">
                                    <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                                    <p className="text-gray-500 text-sm">Loading activity data...</p>
                                </div>
                            ) : dailyData.some(d => d.count > 0) ? (
                                <div className="w-full h-[250px] md:h-[350px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={dailyData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.5} />
                                                    <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                            <XAxis
                                                dataKey="hourLabel"
                                                stroke="#666"
                                                tick={{ fill: '#666', fontSize: 10 }}
                                                tickLine={false}
                                                axisLine={false}
                                                interval="preserveStartEnd"
                                                minTickGap={15}
                                            />
                                            <YAxis
                                                stroke="#666"
                                                tick={{ fill: '#666', fontSize: 10 }}
                                                tickLine={false}
                                                axisLine={false}
                                            />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Area
                                                type="monotone"
                                                dataKey="count"
                                                stroke="#60a5fa"
                                                strokeWidth={3}
                                                fillOpacity={1}
                                                fill="url(#colorCount)"
                                                animationDuration={500}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-[250px] md:h-[300px] text-gray-500">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mb-3 opacity-50">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p>No activity recorded for this day.</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ActivityGraphModal;
