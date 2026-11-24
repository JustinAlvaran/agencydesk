export function ContactBackground() {
  return (
    <div className="hidden lg:block absolute inset-0 overflow-hidden">
      <div className="h-[440px] w-[440px] bg-black/5 dark:bg-white/5 rounded-full absolute top-[22%] left-[3%] 2xl:left-[10%] 3xl:left-[12%] backdrop-blur-2xl"/>
      <div className="h-[440px] w-[440px] bg-primary/5 rounded-full absolute top-[22%] xl:left-[18%] 2xl:left-[25%] 3xl:left-[26%]"/>
    </div>
  )
}
