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
            transition: { staggerChildren: 0.1 }
        }
    }

    // The puzzle-like snapping of individual letters
    const letterVariants = {
        hidden: () => ({
            opacity: 0,
            x: (Math.random() * 200) - 100, 
            y: (Math.random() * -100) - 50,
            rotate: (Math.random() * 180) - 90,
            scale: 0.5,
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
                stiffness: 150,
                duration: 1.5
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
                    <div className="flex mr-4 text-white">
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
                    This appears exactly when the 'drop' phase hits 
                */}
                <motion.div
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={
                        (phase === 'drop' || phase === 'float') 
                            ? { scaleX: 1, opacity: 1, transition: { duration: 0.4, delay: 0.1 } } 
                            : { scaleX: 0, opacity: 0 }
                    }
                    className="absolute -bottom-8 w-[140%] h-[1px] bg-primary/40 blur-[1px]"
                >
                    {/* Continuous water line pulse during float */}
                    <motion.div 
                        animate={ phase === 'float' ? { 
                            scaleX: [1, 1.1, 1],
                            opacity: [0.6, 0.2, 0.6],
                            transition: { repeat: Infinity, duration: 2, ease: "easeInOut" }
                        } : {}}
                        className="w-full h-full bg-primary"
                    />
                </motion.div>

                {/* The one-time Splash Ring expansion */}
                {phase === 'drop' && (
                    <motion.div
                        initial={{ scale: 0.5, opacity: 1, width: '100px', height: '20px' }}
                        animate={{ scale: 3, opacity: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                        className="absolute -bottom-10 left-1/2 -translate-x-1/2 border-2 border-primary/50 rounded-[100%] pointer-events-none"
                    />
                )}
            </motion.div>

            {/* Background pool illumination that fades in on splash */}
            <motion.div 
                initial={{ opacity: 0 }}
                animate={ (phase === 'drop' || phase === 'float') ? { opacity: 0.15 } : { opacity: 0 }}
                transition={{ duration: 1, delay: 0.2 }}
                className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-primary to-transparent pointer-events-none"
            />
        </motion.div>
    )
}
