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

        // TIMING: "Quick and Twitchy" - faster snaps and transitions
        const dropTimer = setTimeout(() => {
            setPhase('drop')
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate(10) // Light quick haptic
            }
        }, 1200) // Much faster puzzle snap
        const floatTimer = setTimeout(() => setPhase('float'), 1600) 
        const exitTimer = setTimeout(() => {
            setShouldExit(true)
            globalSplashSeen = true
            setTimeout(() => setPhase('done'), 400) // Fast fade out
        }, 2800) // Shorter total wait

        return () => {
             clearTimeout(dropTimer)
             clearTimeout(floatTimer)
             clearTimeout(exitTimer)
        }
    }, [hasSeenSplash])

    if (hasSeenSplash || phase === 'done') return null

    // Container controls the drop and float sequence of the whole group
    const dropFloatVariants = {
        puzzle: { y: 0 },
        drop: { 
            y: 120, 
            transition: { 
                type: "spring" as const, 
                stiffness: 200, 
                damping: 12,
                mass: 1.5 
            } 
        },
        float: { 
            y: [120, 110, 120],
            transition: { 
                repeat: Infinity, 
                duration: 3, 
                ease: "easeInOut" as const
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
                damping: 20,
                stiffness: 80,
                mass: 0.5,
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
                    BOUNDLESS ORGANIC RIPPLES
                    No lines, just soft radial glows that feel like real water
                */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200vw] h-[200vh] pointer-events-none">
                    <AnimatePresence>
                        {(phase === 'drop' || phase === 'float') && (
                            <>
                                {[0, 1, 2, 3, 4].map((i) => (
                                    <motion.div
                                        key={`boundless-ripple-${i}`}
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ 
                                            scale: [0.2, 1.5],
                                            opacity: [0.15, 0],
                                        }}
                                        transition={{
                                            repeat: Infinity,
                                            duration: 4,
                                            delay: i * 0.8,
                                            ease: "easeOut"
                                        }}
                                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full bg-gradient-to-r from-primary/10 via-primary/5 to-transparent blur-3xl"
                                    />
                                ))}
                                
                                {/* Ambient water shimmer - non-linear, organic */}
                                <motion.div 
                                    animate={{ 
                                        scale: [1, 1.1, 1],
                                        opacity: [0.1, 0.2, 0.1],
                                        rotate: [0, 5, 0]
                                    }}
                                    transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                                    className="absolute inset-0 bg-[radial-gradient(circle_at_50%_70%,rgba(0,122,255,0.1)_0%,transparent_70%)]"
                                />
                            </>
                        )}
                    </AnimatePresence>
                </div>

                {/* The Splash Ring expansion - multiple soft rings */}
                {phase === 'drop' && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                        {[0, 0.05, 0.1].map((delay, i) => (
                            <motion.div
                                key={`soft-splash-${i}`}
                                initial={{ scale: 0.1, opacity: 1, width: '200px', height: '200px' }}
                                animate={{ scale: 3, opacity: 0 }}
                                transition={{ duration: 0.8, ease: "easeOut", delay }}
                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-[10px] border-primary/20 rounded-full blur-xl pointer-events-none"
                            />
                        ))}
                    </div>
                )}
            </motion.div>

            {/* Background pool illumination */}
            <motion.div 
                initial={{ opacity: 0 }}
                animate={ (phase === 'drop' || phase === 'float') ? { opacity: 0.3 } : { opacity: 0 }}
                transition={{ duration: 0.5, delay: 0 }}
                className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-primary/20 to-transparent pointer-events-none"
            />
        </motion.div>
    )
}
