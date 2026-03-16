"use client"

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'

let globalSplashSeen = false

export default function AnimatedSplash() {
    // We break the text into arrays for individual letter animation
    const word1 = "POOL".split("")
    const word2 = "PARTY".split("")

    // Animation phases:
    // 1. 'puzzle': letters start scattered slowly, then snap together fast
    // 2. 'drop': the entire group drops down due to "gravity"
    // 3. 'float': a splash occurs and the words float on the water line
    const [phase, setPhase] = useState<'puzzle' | 'drop' | 'float' | 'done'>('puzzle')
    const [shouldExit, setShouldExit] = useState(false)
    const [hasSeenSplash] = useState(globalSplashSeen)

    useEffect(() => {
        if (hasSeenSplash) return

        // ORCHESTRATION: One smooth continuous motion
        // Puzzle snap happens over ~0.8s
        const dropTimer = setTimeout(() => {
            setPhase('drop')
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate([10, 5, 10]) // Multi-hit subtle haptic
            }
        }, 850) // perfectly catch the end of the snap
        
        const floatTimer = setTimeout(() => setPhase('float'), 1350) 
        
        const exitTimer = setTimeout(() => {
            setShouldExit(true)
            globalSplashSeen = true
            setTimeout(() => setPhase('done'), 400)
        }, 3000)

        return () => {
             clearTimeout(dropTimer)
             clearTimeout(floatTimer)
             clearTimeout(exitTimer)
        }
    }, [hasSeenSplash])

    if (hasSeenSplash || phase === 'done') return null

    // Container controls the drop and float sequence of the whole group
    const dropFloatVariants = {
        puzzle: { y: 0, scale: 0.95 },
        drop: { 
            y: 110, 
            scale: 1,
            transition: { 
                type: "spring" as const, 
                stiffness: 500, 
                damping: 25,
                mass: 0.8,
                restDelta: 0.001
            } 
        },
        float: { 
            y: [110, 104, 110],
            rotate: [-0.5, 0.5, -0.5],
            transition: { 
                y: { repeat: Infinity, duration: 4, ease: "easeInOut" },
                rotate: { repeat: Infinity, duration: 6, ease: "easeInOut" }
            }
        }
    }

    // Controls the staggered timing of the letters appearing
    const textContainerVariants = {
        hidden: { opacity: 1 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.08 }
        }
    }

    // The puzzle-like snapping of individual letters
    const letterVariants = {
        hidden: () => ({
            opacity: 0,
            x: (Math.random() * 160) - 80, 
            y: (Math.random() * -80) - 40,
            rotate: (Math.random() * 90) - 45,
            scale: 0.8,
        }),
        visible: {
            opacity: 1,
            x: 0,
            y: 0,
            rotate: 0,
            scale: 1,
            transition: {
                type: "spring" as const,
                damping: 15,
                stiffness: 300,
                mass: 0.4,
            }
        }
    }

    return (
        <motion.div 
            initial={{ opacity: 1 }}
            animate={shouldExit ? { opacity: 0, scale: 1.1, pointerEvents: "none" } : { opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black overflow-hidden"
        >
            {/* The main block that handles the gravity drop and floating */}
            <motion.div
                variants={dropFloatVariants}
                initial="puzzle"
                animate={phase}
                className="relative flex flex-col items-center"
            >
                {/* The text container that triggers the letter puzzle snap */}
                <motion.div 
                    variants={textContainerVariants} 
                    initial="hidden" 
                    animate="visible"
                    className="flex text-[13vw] sm:text-7xl font-black font-outfit tracking-tighter"
                >
                    <div className="flex mr-4 text-primary">
                        {word1.map((letter, i) => (
                            <motion.span key={`pool-${i}`} custom={i} variants={letterVariants} className="inline-block origin-bottom">
                                {letter}
                            </motion.span>
                        ))}
                    </div>
                    <div className="flex text-primary">
                        {word2.map((letter, i) => (
                            <motion.span key={`party-${i}`} custom={i} variants={letterVariants} className="inline-block origin-bottom">
                                {letter}
                            </motion.span>
                        ))}
                    </div>
                </motion.div>

                {/* 
                    WATER RIPPLES - TRULY ORGANIC
                    Using radial rings to form clear expanding waves
                */}
                <div className="absolute top-[120px] left-1/2 -translate-x-1/2 w-0 h-0 pointer-events-none">
                    <AnimatePresence>
                        {(phase === 'drop' || phase === 'float') && (
                            <div className="relative flex justify-center items-center">
                                {[0, 1, 2, 3].map((i) => (
                                    <motion.div
                                        key={`ripple-wave-${i}`}
                                        initial={{ width: 0, height: 0, opacity: 0 }}
                                        animate={{ 
                                            width: ['0px', '1000px'],
                                            height: ['0px', '250px'],
                                            opacity: [0.35, 0],
                                        }}
                                        transition={{
                                            repeat: Infinity,
                                            duration: 5,
                                            delay: i * 1.25,
                                            ease: "easeOut"
                                        }}
                                        className="absolute rounded-full border-[2px] border-primary/25 blur-[3px]"
                                    />
                                ))}

                                {/* Organic Center Bloom */}
                                <motion.div 
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 0.15 }}
                                    className="absolute w-[700px] h-[350px] bg-primary/20 blur-[90px] rounded-full"
                                />
                            </div>
                        )}
                    </AnimatePresence>
                </div>

                {/* The Splash Ring expansion - one-time fast impact rings */}
                {phase === 'drop' && (
                    <div className="absolute top-[110px] left-1/2 -translate-x-1/2">
                        {[0, 0.03, 0.08, 0.15].map((delay, i) => (
                            <motion.div
                                key={`impact-wave-${i}`}
                                initial={{ width: '40px', height: '10px', opacity: 1 }}
                                animate={{ width: '1000px', height: '250px', opacity: 0 }}
                                transition={{ duration: 1.5, ease: "easeOut", delay }}
                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-[1px] border-primary/40 rounded-full blur-md pointer-events-none"
                            />
                        ))}
                        
                        {/* High-fidelity Splash Particles */}
                        {[...Array(12)].map((_, i) => (
                            <motion.div
                                key={`particle-${i}`}
                                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                                animate={{ 
                                    x: (Math.random() - 0.5) * 160,
                                    y: -(Math.random() * 120 + 60),
                                    opacity: 0,
                                    scale: 0.1
                                }}
                                transition={{ duration: 1, ease: "easeOut", delay: 0.05 }}
                                className="absolute top-0 left-1/2 w-1.5 h-1.5 bg-primary/80 rounded-full blur-[0.5px] shadow-[0_0_10px_rgba(0,122,255,0.5)]"
                            />
                        ))}
                    </div>
                )}
            </motion.div>

            {/* Background pool illumination */}
            <motion.div 
                initial={{ opacity: 0 }}
                animate={ (phase === 'drop' || phase === 'float') ? { opacity: 0.3 } : { opacity: 0 }}
                transition={{ duration: 0.6 }}
                className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-primary/15 to-transparent pointer-events-none"
            />
        </motion.div>
    )
}
