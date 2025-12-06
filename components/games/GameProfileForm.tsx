"use client";
import type { GameProfileFormInnerProps } from "./forms/types";
import { DefaultGameProfileForm } from "./forms/GameProfileFormDefault";
import { ValorantGameProfileForm } from "./forms/GameProfileFormValorant";
import { ApexGameProfileForm } from "./forms/GameProfileFormApex";
import { OverwatchGameProfileForm } from "./forms/GameProfileFormOverwatch";

type Props = GameProfileFormInnerProps;

export function GameProfileForm(props: Props) {
  if (props.slug === "apex-legends") {
    return <ApexGameProfileForm {...props} />;
  }
  if (props.slug === "overwatch-2") {
    return <OverwatchGameProfileForm {...props} />;
  }
  if (props.slug === "valorant") {
    return <ValorantGameProfileForm {...props} />;
  }
  return <DefaultGameProfileForm {...props} />;
}

