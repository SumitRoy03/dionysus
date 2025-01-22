import type React from "react"

interface CustomCircularProgressProps {
  progress: number
  size?: number
  strokeWidth?: number
  circleColor?: string
  progressColor?: string
  textColor?: string
}

const CustomCircularProgress: React.FC<CustomCircularProgressProps> = ({
  progress,
  size = 80,
  strokeWidth = 8,
  circleColor = "#e6e6e6",
  progressColor = "#000000",
  textColor = "#000000",
}) => {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          className="text-gray-200"
          strokeWidth={strokeWidth}
          stroke={circleColor}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className="text-primary"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          stroke={progressColor}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <span className="absolute text-sm font-semibold" style={{ color: textColor }}>
        {`${Math.round(progress)}%`}
      </span>
    </div>
  )
}

export default CustomCircularProgress

