import React, { useState, useEffect, useRef } from 'react'
import introVideo from '../../assets/intro.mp4'

export default function MobileIntroVideo({ onComplete }) {
  const videoRef = useRef(null)
  const [isFadingOut, setIsFadingOut] = useState(false)
  const [hasEnded, setHasEnded] = useState(false)

  const handleFinish = () => {
    if (hasEnded) return
    setHasEnded(true)
    setIsFadingOut(true)
    setTimeout(() => {
      onComplete()
    }, 250)
  }

  useEffect(() => {
    let timer

    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        handleFinish()
      })
    }

    // Safety fallback timeout (6 seconds max)
    timer = setTimeout(() => {
      handleFinish()
    }, 6000)

    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [])

  return (
    <div
      className={`fixed inset-0 z-[99999] w-full h-full bg-[#000000] flex items-center justify-center overflow-hidden select-none pointer-events-none transition-opacity duration-300 ease-out ${
        isFadingOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <video
        ref={videoRef}
        src={introVideo}
        autoPlay
        muted
        playsInline
        webkit-playsinline="true"
        controls={false}
        disablePictureInPicture
        controlsList="nodownload nofullscreen noremoteplayback"
        onEnded={handleFinish}
        onError={handleFinish}
        onStalled={handleFinish}
        className="w-full h-full object-cover"
      />
    </div>
  )
}


