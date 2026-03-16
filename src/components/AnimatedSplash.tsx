"use client"

import { motion } from 'framer-motion'
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

        // Timeline for the animation sequence
        const dropTimer = setTimeout(() => {
            setPhase('drop')
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate(20) // Heavy haptic on drop splash
            }
        }, 1800) // Faster puzzle snap
        const floatTimer = setTimeout(() => setPhase('float'), 2400) // Splash float
        const exitTimer = setTimeout(() => {
            setShouldExit(true)
            globalSplashSeen = true
            setTimeout(() => setPhase('done'), 800) // Wait for fade out animation
        }, 3600) // Total time before fading out

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
                    WATER LINE & RIPPLE SPLASH 
                    Multiple layers for a richer effect
                */}
                <div className="absolute -bottom-8 w-full flex flex-col items-center">
                    {/* Primary Water Line */}
                    <motion.div
                        initial={{ scaleX: 0, opacity: 0 }}
                        animate={
                            (phase === 'drop' || phase === 'float') 
                                ? { scaleX: 1.5, opacity: 1, transition: { duration: 0.6, ease: "easeOut" } } 
                                : { scaleX: 0, opacity: 0 }
                        }
                        className="w-[120%] h-[2px] bg-primary/40 blur-[1px] relative"
                    >
                        {/* Continuous water line pulse during float */}
                        <motion.div 
                            animate={ phase === 'float' ? { 
                                scaleX: [1, 1.2, 1],
                                opacity: [0.8, 0.3, 0.8],
                                transition: { repeat: Infinity, duration: 3, ease: "easeInOut" }
                            } : {}}
                            className="w-full h-full bg-primary shadow-[0_0_15px_rgba(0,122,255,0.8)]"
                        />
                    </motion.div>

                    {/* Secondary Ripples (Concentric) */}
                    {(phase === 'drop' || phase === 'float') && (
                        <div className="absolute top-0 w-full flex justify-center">
                            {[0, 1, 2].map((i) => (
                                <motion.div
                                    key={`ripple-${i}`}
                                    initial={{ scaleX: 0, opacity: 0, translateY: i * 8 }}
                                    animate={{ 
                                        scaleX: [1.2, 1.6, 1.2],
                                        opacity: [0.2, 0.1, 0.2],
                                        translateY: i * 8,
                                    }}
                                    transition={{
                                        repeat: Infinity,
                                        duration: 4,
                                        delay: i * 0.8,
                                        ease: "easeInOut"
                                    }}
                                    className="absolute w-[140%] h-[1px] bg-primary/30 blur-[2px]"
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* The Splash Ring expansion - multiple rings now */}
                {phase === 'drop' && (
                    <>
                        {[0, 0.1, 0.2].map((delay, i) => (
                            <motion.div
                                key={`splash-ring-${i}`}
                                initial={{ scale: 0.3, opacity: 1, width: '100px', height: '20px' }}
                                animate={{ scale: 4 + i, opacity: 0 }}
                                transition={{ duration: 1.2, ease: "easeOut", delay }}
                                className="absolute -bottom-10 left-1/2 -translate-x-1/2 border-[3px] border-primary/40 rounded-[100%] pointer-events-none blur-[1px]"
                            />
                        ))}
                    </>
                )}
            </motion.div>

            {/* Background pool illumination that fades in on splash */}
            <motion.div 
                initial={{ opacity: 0 }}
                animate={ (phase === 'drop' || phase === 'float') ? { opacity: 0.25 } : { opacity: 0 }}
                transition={{ duration: 1.5, delay: 0.2 }}
                className="absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-t from-primary/30 via-primary/5 to-transparent pointer-events-none"
            />
        </motion.div>
    )
}
