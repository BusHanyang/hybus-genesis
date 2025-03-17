import React from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import tw from 'twin.macro'

import Animation, { useAnimation } from '@/components/routemap/Animation'
import useResponsive from '@/components/routemap/Responsive'

const RouteLine = styled.div`
  ${tw`absolute transition duration-150 ease-in-out z-0 h-[0.2rem] top-1 rt1:top-[0.2rem] rt1:h-[0.16rem] left-[0.6rem] max-w-[13.125rem]`}
`

const Circle = styled.span`
  ${tw`
        flex rounded-full inline-block
        h-3 w-3 rt1:h-2.5 rt1:w-2.5
        z-1 mx-2
    `}
`

const RouteStations = styled.div`
  ${tw`transition duration-150 ease-in-out flex relative`}
`

const SpecialStopsText = styled.p<{ key: number; lang: string }>`
  ${tw`absolute text-xs top-[-17px] left-[-15px] text-center w-10 font-bold`}
  ${(props) =>
    props.lang === 'ko'
      ? tw`tracking-tight`
      : tw`tracking-tighter text-[0.7rem]`}
`

const LineRoute = (props: {
  rootStatus: string
  isPrevStop: (line: string, index: number) => boolean
  index: number
}) => {
  const screenWidth = useResponsive()

  if (props.rootStatus === 'direct' && props.index === 4) return
  else if (props.index === 5) return

  switch (props.rootStatus) {
    case 'direct':
      if (props.index === 3)
        return (
          <RouteLine
            style={{ width: screenWidth / 6.2 }}
            className={
              props.isPrevStop('direct', props.index)
                ? 'bg-chip-orange'
                : 'bg-zinc-200 dark:bg-slate-500'
            }
          />
        )
      return (
        <RouteLine
          style={{ width: screenWidth / 6.2 }}
          className={
            props.isPrevStop('direct', props.index)
              ? 'bg-chip-blue'
              : 'bg-zinc-200 dark:bg-slate-500'
          }
        />
      )
    case 'cycle':
      if (props.index === 4)
        return (
          <RouteLine
            style={{ width: screenWidth / 6.2 }}
            className={
              props.isPrevStop('cycle', props.index)
                ? 'bg-chip-orange'
                : 'bg-zinc-200 dark:bg-slate-500'
            }
          />
        )
      return (
        <RouteLine
          style={
            props.index >= 2 && props.index <= 3
              ? { width: screenWidth / 6.2 / 2 }
              : { width: screenWidth / 6.2 }
          }
          className={
            props.isPrevStop('cycle', props.index)
              ? 'bg-chip-red'
              : 'bg-zinc-200 dark:bg-slate-500'
          }
        />
      )
    case 'yesulin':
      if (props.index === 4)
        return (
          <RouteLine
            style={{ width: screenWidth / 6.2 }}
            className={
              props.isPrevStop('yesulin', props.index)
                ? 'bg-chip-orange'
                : 'bg-zinc-200 dark:bg-slate-500'
            }
          />
        )
      return (
        <RouteLine
          style={
            props.index >= 2 && props.index <= 3
              ? { width: screenWidth / 6.2 / 2 }
              : { width: screenWidth / 6.2 }
          }
          className={
            props.isPrevStop('yesulin', props.index)
              ? 'bg-chip-green'
              : 'bg-zinc-200 dark:bg-slate-500'
          }
        />
      )
    case 'jungang':
      if (props.index === 4)
        return (
          <RouteLine
            style={{ width: screenWidth / 6.2 }}
            className={
              props.isPrevStop('jungang', props.index)
                ? 'bg-chip-orange'
                : 'bg-zinc-200 dark:bg-slate-500'
            }
          />
        )
      return (
        <RouteLine
          style={
            props.index >= 2 && props.index <= 3
              ? { width: screenWidth / 6.2 / 2 }
              : { width: screenWidth / 6.2 }
          }
          className={
            props.isPrevStop('jungang', props.index)
              ? 'bg-chip-purple'
              : 'bg-zinc-200 dark:bg-slate-500'
          }
        />
      )
    default:
      return <></>
  }
}

const RouteVisual = (props: { rootStatus: string; tab: string }) => {
  const { t, i18n } = useTranslation()
  const timetable = useAnimation(props.tab)

  const isPrevStop = (line: string, index: number) => {
    switch (props.tab) {
      case 'shuttlecoke_o':
        return index !== 0
      case 'shuttlecoke_i':
        if (line === 'direct') return index >= 3
        return index >= 4
      case 'subway':
        if (line === 'yesulin') return false
        return index >= 2
      case 'yesulin':
        if (line === 'direct' || line === 'jungang') return false
        return index >= 3
      case 'jungang':
        if (line === 'jungang') return index >= 3
        return false
      default:
        return true
    }
  }

  const directDot = () => {
    const arrDir = []

    for (let i = 0; i < 5; i++) {
      if (i === 4) {
        arrDir.push(
          <RouteStations id="dirdot" key={i}>
            <Circle
              className={
                isPrevStop('direct', i)
                  ? 'bg-chip-orange'
                  : 'bg-zinc-200 dark:bg-slate-500'
              }
            />
            <Animation
              isOn={timetable.direct[i]}
              index={i}
              rootStatus={props.rootStatus}
            />
          </RouteStations>,
        )
        continue
      }
      arrDir.push(
        <RouteStations id="dirdot" key={i}>
          <Circle
            className={
              isPrevStop('direct', i)
                ? 'bg-chip-blue'
                : 'bg-zinc-200 dark:bg-slate-500'
            }
          />
          <LineRoute
            rootStatus={props.rootStatus}
            isPrevStop={isPrevStop}
            index={i}
          />
          <Animation
            isOn={timetable.direct[i]}
            index={i}
            rootStatus={props.rootStatus}
          />
        </RouteStations>,
      )
    }

    return (
      <>
        {arrDir.map((item) => {
          return item
        })}
      </>
    )
  }

  const cycleDot = () => {
    const arrCyc = []

    for (let i = 0; i < 6; i++) {
      if (i === 2) {
        arrCyc.push(
          <div
            key={i}
            className="col-span-2 grid grid-cols-3 w-[75%] place-items-center"
          >
            <RouteStations id="cycdot" key={i}>
              <Circle
                className={
                  isPrevStop('cycle', i)
                    ? 'bg-chip-red'
                    : 'bg-zinc-200 dark:bg-slate-500'
                }
              />
              <LineRoute
                rootStatus={props.rootStatus}
                isPrevStop={isPrevStop}
                index={i}
              />
              <Animation
                isOn={timetable.cycle[i]}
                index={i}
                rootStatus={props.rootStatus}
              />
            </RouteStations>
            <RouteStations id="cycdot" key={i + 1}>
              <Circle
                className={`${isPrevStop('cycle', i + 1) ? 'bg-chip-red' : 'bg-zinc-200 dark:bg-slate-500'} grid grid-rows-2 relative`}
              >
                <SpecialStopsText
                  key={0}
                  lang={i18n.language}
                  className={
                    isPrevStop('cycle', 3)
                      ? 'text-chip-red'
                      : 'text-zinc-200 dark:text-slate-500'
                  }
                >
                  {t('yesul')}
                </SpecialStopsText>
              </Circle>
              <LineRoute
                rootStatus={props.rootStatus}
                isPrevStop={isPrevStop}
                index={i + 1}
              />
              <Animation
                isOn={timetable.cycle[i + 1]}
                index={i + 1}
                rootStatus={props.rootStatus}
              />
            </RouteStations>
            <RouteStations id="cycdot" key={i + 2}>
              <Circle
                className={
                  isPrevStop('cycle', i + 2)
                    ? 'bg-chip-red'
                    : 'bg-zinc-200 dark:bg-slate-500'
                }
              />
              <LineRoute
                rootStatus={props.rootStatus}
                isPrevStop={isPrevStop}
                index={i + 2}
              />
              <Animation
                isOn={timetable.cycle[i + 2]}
                index={i + 2}
                rootStatus={props.rootStatus}
              />
            </RouteStations>
          </div>,
        )
        i += 2
        continue
      }
      if (i === 5) {
        arrCyc.push(
          <RouteStations id="cycdot" key={i}>
            <Circle
              className={
                isPrevStop('cycle', i)
                  ? 'bg-chip-orange'
                  : 'bg-zinc-200 dark:bg-slate-500'
              }
            />
            <Animation
              isOn={timetable.cycle[i]}
              index={i}
              rootStatus={props.rootStatus}
            />
          </RouteStations>,
        )
        continue
      }
      arrCyc.push(
        <RouteStations id="cycdot" key={i}>
          <Circle
            className={
              isPrevStop('cycle', i)
                ? 'bg-chip-red'
                : 'bg-zinc-200 dark:bg-slate-500'
            }
          />
          <LineRoute
            rootStatus={props.rootStatus}
            isPrevStop={isPrevStop}
            index={i}
          />
          <Animation
            isOn={timetable.cycle[i]}
            index={i}
            rootStatus={props.rootStatus}
          />
        </RouteStations>,
      )
    }

    return (
      <>
        {arrCyc.map((item) => {
          return item
        })}
      </>
    )
  }

  const yesulDot = () => {
    const arrYes = []

    for (let i = 0; i < 6; i++) {
      if (i === 2) {
        arrYes.push(
          <div
            key={i}
            className="col-span-2 grid grid-cols-3 w-[75%] place-items-center"
          >
            <RouteStations id="yesdot" key={i} title="skip">
              <Circle className="opacity-0" />
              <LineRoute
                rootStatus={props.rootStatus}
                isPrevStop={isPrevStop}
                index={i}
              />
            </RouteStations>
            <RouteStations id="yesdot" key={i + 1}>
              <Circle
                className={`${isPrevStop('yesulin', i + 1) ? 'bg-chip-green' : 'bg-zinc-200 dark:bg-slate-500'} grid grid-rows-2 relative`}
              >
                <SpecialStopsText
                  key={1}
                  lang={i18n.language}
                  className={
                    isPrevStop('yesulin', 3)
                      ? 'text-chip-green'
                      : 'text-zinc-200 dark:text-slate-500'
                  }
                >
                  {t('yesul')}
                </SpecialStopsText>
              </Circle>
              <LineRoute
                rootStatus={props.rootStatus}
                isPrevStop={isPrevStop}
                index={i + 1}
              />
              <Animation
                isOn={timetable.yesulin[i]}
                index={i}
                rootStatus={props.rootStatus}
              />
            </RouteStations>
            <RouteStations id="yesdot" key={i + 2}>
              <Circle
                className={
                  isPrevStop('yesulin', i + 2)
                    ? 'bg-chip-green'
                    : 'bg-zinc-200 dark:bg-slate-500'
                }
              />
              <LineRoute
                rootStatus={props.rootStatus}
                isPrevStop={isPrevStop}
                index={i + 2}
              />
              <Animation
                isOn={timetable.yesulin[i + 1]}
                index={i + 1}
                rootStatus={props.rootStatus}
              />
            </RouteStations>
          </div>,
        )
        i += 2
        continue
      }
      if (i === 5) {
        arrYes.push(
          <RouteStations id="yesdot" key={i}>
            <Circle
              className={
                isPrevStop('yesulin', i)
                  ? 'bg-chip-orange'
                  : 'bg-zinc-200 dark:bg-slate-500'
              }
            />
            <Animation
              isOn={timetable.yesulin[i - 1]}
              index={i - 1}
              rootStatus={props.rootStatus}
            />
          </RouteStations>,
        )
        continue
      }
      arrYes.push(
        <RouteStations id="yesdot" key={i}>
          <Circle
            className={
              isPrevStop('yesulin', i)
                ? 'bg-chip-green'
                : 'bg-zinc-200 dark:bg-slate-500'
            }
          />
          <LineRoute
            rootStatus={props.rootStatus}
            isPrevStop={isPrevStop}
            index={i}
          />
          <Animation
            isOn={timetable.yesulin[i > 2 ? i - 1 : i]}
            index={i > 2 ? i - 1 : i}
            rootStatus={props.rootStatus}
          />
        </RouteStations>,
      )
    }

    return (
      <>
        {arrYes.map((item) => {
          return item
        })}
      </>
    )
  }

  const jungDot = () => {
    const arrJun = []

    for (let i = 0; i < 6; i++) {
      if (i === 2) {
        arrJun.push(
          <div
            key={i}
            className="col-span-2 grid grid-cols-3 w-[75%] place-items-center"
          >
            <RouteStations id="jundot" key={i}>
              <Circle
                className={
                  isPrevStop('jungang', i)
                    ? 'bg-chip-purple'
                    : 'bg-zinc-200 dark:bg-slate-500'
                }
              />
              <LineRoute
                rootStatus={props.rootStatus}
                isPrevStop={isPrevStop}
                index={i}
              />
              <Animation
                isOn={timetable.jungang[i]}
                index={i}
                rootStatus={props.rootStatus}
              />
            </RouteStations>
            <RouteStations id="jundot" key={i + 1}>
              <Circle
                className={`${isPrevStop('jungang', i + 1) ? 'bg-chip-purple' : 'bg-zinc-200 dark:bg-slate-500'} grid grid-rows-2 relative`}
              >
                <SpecialStopsText
                  key={2}
                  lang={i18n.language}
                  className={
                    isPrevStop('jungang', i + 1)
                      ? 'text-chip-purple'
                      : 'text-zinc-200 dark:text-slate-500'
                  }
                >
                  {t('jung')}
                </SpecialStopsText>
              </Circle>
              <LineRoute
                rootStatus={props.rootStatus}
                isPrevStop={isPrevStop}
                index={i + 1}
              />
              <Animation
                isOn={timetable.jungang[i + 1]}
                index={i + 1}
                rootStatus={props.rootStatus}
              />
            </RouteStations>
            <RouteStations id="jundot" key={i + 2}>
              <Circle
                className={
                  isPrevStop('jungang', i + 2)
                    ? 'bg-chip-purple'
                    : 'bg-zinc-200 dark:bg-slate-500'
                }
              />
              <LineRoute
                rootStatus={props.rootStatus}
                isPrevStop={isPrevStop}
                index={i + 2}
              />
              <Animation
                isOn={timetable.jungang[i + 2]}
                index={i + 2}
                rootStatus={props.rootStatus}
              />
            </RouteStations>
          </div>,
        )
        i += 2
        continue
      }
      if (i === 5) {
        arrJun.push(
          <RouteStations id="jundot" key={i}>
            <Circle
              className={
                isPrevStop('jungang', i)
                  ? 'bg-chip-orange'
                  : 'bg-zinc-200 dark:bg-slate-500'
              }
            />
            <Animation
              isOn={timetable.jungang[i]}
              index={i}
              rootStatus={props.rootStatus}
            />
          </RouteStations>,
        )
        continue
      }
      arrJun.push(
        <RouteStations id="jundot" key={i}>
          <Circle
            className={
              isPrevStop('jungang', i)
                ? 'bg-chip-purple'
                : 'bg-zinc-200 dark:bg-slate-500'
            }
          />
          <LineRoute
            rootStatus={props.rootStatus}
            isPrevStop={isPrevStop}
            index={i}
          />
          <Animation
            isOn={timetable.jungang[i]}
            index={i}
            rootStatus={props.rootStatus}
          />
        </RouteStations>,
      )
    }

    return (
      <>
        {arrJun.map((item) => {
          return item
        })}
      </>
    )
  }

  switch (props.rootStatus) {
    case 'direct':
      return directDot()
    case 'cycle':
      return cycleDot()
    case 'yesulin':
      return yesulDot()
    case 'jungang':
      return jungDot()
    default:
      return <></>
  }
}

export default RouteVisual
