export const platformStats = [
  { value: '98.6%', label: 'identity match accuracy' },
  { value: '< 2 sec', label: 'live incident alert latency' },
  { value: '24/7', label: 'exam room monitoring coverage' },
]

export const monitoringSignals = [
  {
    title: 'Identity Verification',
    description:
      'Authenticate each candidate with face match, ID capture, and session-bound access before the timer starts.',
  },
  {
    title: 'Live Behavior Tracking',
    description:
      'Flag multiple faces, gaze shifts, tab changes, device switches, and suspicious audio in real time.',
  },
  {
    title: 'Evidence Timeline',
    description:
      'Store every alert with timestamps, screenshots, and severity markers for post-exam review.',
  },
]

export const controlPanels = [
  'AI-assisted invigilation console',
  'Candidate onboarding and room scan',
  'Automated incident review queue',
  'Institution analytics and audit trail',
]

export const examFlow = [
  {
    step: '01',
    title: 'Register the exam',
    description:
      'Configure duration, security rules, browser restrictions, and escalation policies per assessment.',
  },
  {
    step: '02',
    title: 'Verify every candidate',
    description:
      'Run face capture, ID validation, and environment checks before the session opens.',
  },
  {
    step: '03',
    title: 'Monitor the attempt',
    description:
      'Track webcam, mic, fullscreen state, and suspicious behavior while the exam is in progress.',
  },
  {
    step: '04',
    title: 'Review final evidence',
    description:
      'Inspect incident summaries and confidence scores, then approve or escalate the result.',
  },
]

export const timelineEvents = [
  {
    time: '09:14',
    description: 'Fullscreen exit detected and restored within 4 seconds.',
  },
  {
    time: '09:27',
    description: 'Background voice detected with medium confidence.',
  },
  {
    time: '09:41',
    description: 'Face mismatch alert sent to human invigilator queue.',
  },
]
