// A simple component that adds a center circle gradient to the background.
// Components that use this should be centered in the middle of the screen.
// Components must also use class: "relative z-10"
export default function CenterCircleGradient() {
  return (
    <>
      {/* Abstract Background Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-background to-background pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-lg h-lg bg-primary/5 rounded-full blur-3xl pointer-events-none" />
    </>
  )
}