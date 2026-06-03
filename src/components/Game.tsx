/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { Car } from '../logic/Car';
import { Particle } from '../logic/Particles';
import { Police } from '../logic/Police';
import { Coin } from '../logic/Coin';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Play, RotateCcw, Wallet, Zap, Shield, Car as CarIcon, AlertTriangle } from 'lucide-react';
import { INITIAL_CARS, CarStats, CAR_CONFIG } from '../types';

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showGarage, setShowGarage] = useState(false);
  
  const [money, setMoney] = useState(() => {
    const saved = localStorage.getItem('rm_drift_money');
    return saved ? parseInt(saved) : 500;
  });
  
  const [cars, setCars] = useState<CarStats[]>(() => {
    const saved = localStorage.getItem('rm_drift_cars');
    return saved ? JSON.parse(saved) : INITIAL_CARS;
  });
  
  const [currentCarId, setCurrentCarId] = useState(() => {
    const saved = localStorage.getItem('rm_drift_current_car');
    return saved ? parseInt(saved) : 0;
  });

  useEffect(() => {
    localStorage.setItem('rm_drift_money', money.toString());
  }, [money]);

  useEffect(() => {
    localStorage.setItem('rm_drift_cars', JSON.stringify(cars));
  }, [cars]);

  useEffect(() => {
    localStorage.setItem('rm_drift_current_car', currentCarId.toString());
  }, [currentCarId]);
  
  const [score, setScore] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [health, setHealth] = useState(100);
  const [isGameOver, setIsGameOver] = useState(false);
  const [lastHitTime, setLastHitTime] = useState(0);
  const [notifications, setNotifications] = useState<{id: number, text: string}[]>([]);

  const carRef = useRef<Car | null>(null);
  const policeRef = useRef<Police[]>([]);
  const coinsRef = useRef<Coin[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const keysRef = useRef<Set<string>>(new Set());

  const currentCar = cars[currentCarId];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => keysRef.current.add(e.key);
    const handleKeyUp = (e: KeyboardEvent) => keysRef.current.delete(e.key);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const startGame = () => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    carRef.current = new Car(clientWidth / 2, clientHeight / 2, currentCar);
    policeRef.current = [];
    coinsRef.current = [];
    particlesRef.current = [];
    
    // Spawn initial coins
    for(let i=0; i<10; i++) spawnCoin();
    
    setScore(0);
    setHealth(100);
    setMultiplier(1);
    setIsGameOver(false);
    setIsPlaying(true);
  };

  const spawnCoin = (isMega = false) => {
    if (!canvasRef.current) return;
    const x = Math.random() * canvasRef.current.width;
    const y = Math.random() * canvasRef.current.height;
    // 10% chance to be mega if not specified
    const mega = isMega || Math.random() < 0.1;
    coinsRef.current.push(new Coin(x, y, mega));
  };

  const spawnPolice = () => {
    if (!canvasRef.current) return;
    const edge = Math.floor(Math.random() * 4);
    let x = 0, y = 0;
    if (edge === 0) { x = Math.random() * canvasRef.current.width; y = -50; }
    if (edge === 1) { x = canvasRef.current.width + 50; y = Math.random() * canvasRef.current.height; }
    if (edge === 2) { x = Math.random() * canvasRef.current.width; y = canvasRef.current.height + 50; }
    if (edge === 3) { x = -50; y = Math.random() * canvasRef.current.height; }
    policeRef.current.push(new Police(x, y));
  };

  useEffect(() => {
    let animationFrameId: number;
    let lastPoliceSpawn = 0;

    const loop = (time: number) => {
      if (!canvasRef.current || !carRef.current || !isPlaying || isGameOver) return;

      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;

      const { width, height } = canvasRef.current;

      // Render Background
      ctx.fillStyle = '#0f0f12';
      ctx.fillRect(0, 0, width, height);
      
      // Grid
      ctx.strokeStyle = '#1a1a20';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 100) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); }
      for (let y = 0; y < height; y += 100) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }

      // Update Car
      carRef.current.update(keysRef.current);
      
      // Screen Wrap Car
      if (carRef.current.pos.x < 0) carRef.current.pos.x = width;
      else if (carRef.current.pos.x > width) carRef.current.pos.x = 0;
      if (carRef.current.pos.y < 0) carRef.current.pos.y = height;
      else if (carRef.current.pos.y > height) carRef.current.pos.y = 0;

      // Update & Draw Coins
      coinsRef.current.forEach((coin, idx) => {
        coin.draw(ctx, time);
        const dist = Math.sqrt((coin.pos.x - carRef.current!.pos.x)**2 + (coin.pos.y - carRef.current!.pos.y)**2);
        if (dist < 40) {
            setMoney(m => m + coin.value);
            if (coin.isMega) {
                const id = Date.now();
                setNotifications(n => [...n, { id, text: "MEGA COIN +$300" }]);
                setTimeout(() => setNotifications(n => n.filter(x => x.id !== id)), 2000);
            }
            coinsRef.current.splice(idx, 1);
            spawnCoin();
        }
      });

      // Update & Draw Police
      if (time - lastPoliceSpawn > 5000 && policeRef.current.length < 5) {
        spawnPolice();
        lastPoliceSpawn = time;
      }

      policeRef.current.forEach(p => {
        p.update(carRef.current!.pos);
        p.draw(ctx, time);
        
        const dist = Math.sqrt((p.pos.x - carRef.current!.pos.x)**2 + (p.pos.y - carRef.current!.pos.y)**2);
        if (dist < 30) {
            // Check invincibility
            if (time - lastHitTime > 1500) { // 1.5s invincibility
                setHealth(h => {
                    const newHealth = h - 25;
                    if (newHealth <= 0) {
                        setIsGameOver(true);
                        setIsPlaying(false);
                        return 0;
                    }
                    return newHealth;
                });
                setLastHitTime(time);
            }
        }
      });

      // Drill Smoke
      if (carRef.current.isDrifting) {
        particlesRef.current.push(new Particle(carRef.current.pos.x, carRef.current.pos.y, carRef.current.angle, carRef.current.speed));
        setScore(s => s + 10);
        setMultiplier(m => Math.min(m + 0.005, 5));
      } else {
        setMultiplier(1);
      }

      particlesRef.current = particlesRef.current.filter(p => {
        p.update();
        p.draw(ctx);
        return p.life > 0;
      });

      // Flicker car if invincible
      const isInvincible = time - lastHitTime < 1500;
      if (!isInvincible || Math.floor(time / 100) % 2 === 0) {
        carRef.current.draw(ctx);
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    if (isPlaying && !isGameOver) {
      animationFrameId = requestAnimationFrame(loop);
    }

    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, isGameOver, lastHitTime]);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && canvasRef.current) {
        canvasRef.current.width = containerRef.current.clientWidth;
        canvasRef.current.height = containerRef.current.clientHeight;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const buyCar = (carId: number) => {
    const car = cars[carId];
    if (money >= car.price) {
      setMoney(m => m - car.price);
      setCars(prev => prev.map(c => c.id === carId ? { ...c, unlocked: true } : c));
    }
  };

  const upgradeCar = (carId: number, type: 'speed' | 'handling') => {
    const car = cars[carId];
    const cost = 500;
    if (money >= cost && car.upgrades[type] < CAR_CONFIG.MAX_UPGRADE_LEVEL) {
      setMoney(m => m - cost);
      setCars(prev => prev.map(c => c.id === carId ? { 
        ...c, 
        upgrades: { ...c.upgrades, [type]: c.upgrades[type] + 1 } 
      } : c));
    }
  };

  return (
    <div ref={containerRef} className="relative w-full h-screen bg-[#09090b] text-white">
      <canvas ref={canvasRef} className="block w-full h-full" />

      {/* GAME UI */}
      {isPlaying && (
        <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="bg-black/50 backdrop-blur p-4 border-l-4 border-orange-500">
               <div className="text-[10px] text-zinc-400 uppercase font-bold tracking-widest flex items-center gap-2">
                <Wallet size={12} /> Money
               </div>
               <div className="text-2xl font-black text-amber-400">${money.toLocaleString()}</div>
               <div className="mt-2 w-32 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: '100%' }}
                    animate={{ width: `${health}%` }}
                    className={`h-full ${health > 50 ? 'bg-green-500' : health > 20 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  />
               </div>
               <div className="text-[8px] text-zinc-500 uppercase font-bold mt-1 tracking-widest flex items-center gap-1">
                  <Shield size={8} /> Armor: {health}%
               </div>
            </div>
            
            <div className="bg-black/50 backdrop-blur p-4 border-r-4 border-orange-500 text-right">
               <div className="text-[10px] text-zinc-400 uppercase font-bold tracking-widest">Drift Score</div>
               <div className="text-2xl font-black italic">
                {score.toLocaleString()} <span className="text-orange-500 text-sm">x{multiplier.toFixed(1)}</span>
               </div>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <AnimatePresence>
              {notifications.map(n => (
                <motion.div
                  key={n.id}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  className="bg-amber-500 text-black px-6 py-2 font-black italic uppercase text-lg rounded-none mt-2"
                >
                  {n.text}
                </motion.div>
              ))}
            </AnimatePresence>
            
            {policeRef.current.length > 0 && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }} 
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-8 flex items-center gap-3 bg-red-500 px-6 py-2 rounded-full text-black font-black italic uppercase tracking-wider animate-pulse"
                >
                    <AlertTriangle size={20} /> Chase Active
                </motion.div>
            )}
          </div>
        </div>
      )}

      {/* MENU OVERLAY */}
      {!isPlaying && (
        <div className="absolute inset-0 bg-[#09090b]/95 backdrop-blur-xl flex flex-col items-center justify-center p-8 overflow-y-auto">
          {!showGarage ? (
            <div className="max-w-md w-full text-center space-y-12 pb-20">
              <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                <h1 className="text-8xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-zinc-600 uppercase skew-x-[-8deg] leading-none">
                  RM <span className="text-orange-500">DRIFT</span>
                </h1>
                <p className="mt-4 text-zinc-500 font-mono text-xs tracking-[0.3em] uppercase">High Stakes Underground</p>
              </motion.div>

              {isGameOver && (
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }} 
                    animate={{ scale: 1, opacity: 1 }}
                    className="p-6 bg-red-500/10 border border-red-500/20 rounded-xl"
                  >
                    <div className="text-red-500 font-bold uppercase tracking-widest text-sm mb-1">Busted</div>
                    <div className="text-3xl font-black italic">YOU WERE CAUGHT</div>
                  </motion.div>
              )}

              <div className="grid grid-cols-1 gap-6">
                <button 
                  onClick={startGame}
                  className="group relative bg-orange-500 hover:bg-orange-600 text-black p-6 font-black uppercase italic tracking-widest flex items-center justify-center gap-3 transition-all hover:scale-105 active:scale-95"
                >
                  <Play size={24} fill="currentColor" /> Let's Drift
                  <div className="absolute top-0 right-0 p-1 text-[8px] bg-black text-white px-2">Ready</div>
                </button>

                <div className="grid grid-cols-2 gap-4">
                    <button 
                         onClick={() => setShowGarage(true)}
                         className="bg-zinc-800 hover:bg-zinc-700 p-4 font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                    >
                        <CarIcon size={16} /> Garage
                    </button>
                    <div className="bg-zinc-900 border border-zinc-800 p-4 flex flex-col justify-center items-center">
                        <span className="text-[10px] text-zinc-500 font-bold">Balance</span>
                        <span className="text-amber-400 font-black">${money.toLocaleString()}</span>
                    </div>
                </div>

                {/* Control Guide */}
                <div className="pt-4 grid grid-cols-4 gap-2">
                    {['W', 'A', 'S', 'D'].map(key => (
                        <div key={key} className="bg-zinc-900 border border-zinc-800 p-2 rounded flex flex-col items-center">
                            <span className="text-orange-500 font-black text-sm">{key}</span>
                            <span className="text-[8px] text-zinc-500 uppercase font-bold">
                                {key === 'W' && 'Oldinga'}
                                {key === 'S' && 'Orqaga'}
                                {key === 'A' && 'Chapga'}
                                {key === 'D' && 'O\'ngga'}
                            </span>
                        </div>
                    ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-6xl w-full py-12">
              <div className="flex justify-between items-end mb-12">
                <div>
                    <h2 className="text-4xl font-black italic uppercase tracking-tighter">Underground Garage</h2>
                    <p className="text-zinc-500 text-xs font-mono tracking-widest uppercase">Select and upgrade your fleet</p>
                </div>
                <button 
                    onClick={() => setShowGarage(false)}
                    className="bg-zinc-800 hover:bg-zinc-700 px-6 py-2 font-bold uppercase tracking-widest text-xs"
                >
                    Back to Menu
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 h-[600px] overflow-y-auto pr-4 scrollbar-hide">
                {cars.map((car, idx) => (
                  <div 
                    key={car.id} 
                    className={`group relative p-8 border ${car.unlocked ? 'border-zinc-800 bg-zinc-900/50' : 'border-dashed border-zinc-800 bg-black'} rounded-2xl transition-all hover:border-orange-500/50`}
                  >
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <span className="text-[10px] font-mono text-orange-500 font-bold uppercase tracking-[0.2em]">Spec-{idx + 1}</span>
                            <h3 className="text-2xl font-black italic uppercase tracking-tighter">{car.name}</h3>
                        </div>
                        {car.unlocked ? (
                            <button 
                                onClick={() => { setCurrentCarId(car.id); setShowGarage(false); }}
                                className={`px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors ${currentCarId === car.id ? 'bg-orange-500 text-black' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
                            >
                                {currentCarId === car.id ? 'Selected' : 'Select'}
                            </button>
                        ) : (
                            <button 
                                onClick={() => buyCar(car.id)}
                                disabled={money < car.price}
                                className="bg-amber-500 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-amber-600 text-black px-4 py-1 rounded-sm text-[10px] font-black uppercase tracking-widest"
                            >
                                Buy ${car.price.toLocaleString()}
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 h-24">
                        <div className="flex items-center justify-center bg-black/40 rounded-xl relative overflow-hidden">
                            <div className="absolute w-20 h-10 blur-xl opacity-30" style={{ background: car.color }}></div>
                            <div className="w-12 h-6 border-2" style={{ borderColor: car.color, backgroundColor: car.color + '22' }}></div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] font-bold uppercase text-zinc-500">
                                    <span>Top Speed</span>
                                    <span className="text-white">Lvl {car.upgrades.speed}</span>
                                </div>
                                <div className="h-1 bg-zinc-950 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500" style={{ width: `${(car.upgrades.speed / CAR_CONFIG.MAX_UPGRADE_LEVEL) * 100}%` }}></div>
                                </div>
                                {car.unlocked && car.upgrades.speed < CAR_CONFIG.MAX_UPGRADE_LEVEL && (
                                    <button onClick={() => upgradeCar(car.id, 'speed')} className="w-full py-1 text-[8px] font-bold bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-black uppercase tracking-widest border border-blue-500/20">Upgrade $500</button>
                                )}
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] font-bold uppercase text-zinc-500">
                                    <span>Handling</span>
                                    <span className="text-white">Lvl {car.upgrades.handling}</span>
                                </div>
                                <div className="h-1 bg-zinc-950 rounded-full overflow-hidden">
                                    <div className="h-full bg-orange-500" style={{ width: `${(car.upgrades.handling / CAR_CONFIG.MAX_UPGRADE_LEVEL) * 100}%` }}></div>
                                </div>
                                {car.unlocked && car.upgrades.handling < CAR_CONFIG.MAX_UPGRADE_LEVEL && (
                                    <button onClick={() => upgradeCar(car.id, 'handling')} className="w-full py-1 text-[8px] font-bold bg-orange-500/10 text-orange-400 hover:bg-orange-500 hover:text-black uppercase tracking-widest border border-orange-500/20">Upgrade $500</button>
                                )}
                            </div>
                        </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
