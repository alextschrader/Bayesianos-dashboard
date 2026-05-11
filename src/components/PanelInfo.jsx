import { useState } from 'react'

export default function PanelInfo({ children }) {
  const [show, setShow] = useState(false)
  return (
    <span className="pinfo-wrap" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <span className="pinfo-icon">i</span>
      {show && <div className="pinfo-tip">{children}</div>}
    </span>
  )
}
