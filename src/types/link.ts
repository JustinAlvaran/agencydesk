import React from "react"
import { IconBaseProps } from "react-icons"

export interface Links {
  title: string
  link: string
  target?: boolean
}

export interface ContactLinks {
  title: string
  link: string
  target?: boolean
  icon?: React.ComponentType<IconBaseProps>
}