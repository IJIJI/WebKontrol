import { type JSX } from "react/jsx-runtime";

import "../settings.less";
import "./trackSetting.less";
import { type InputSettingProps } from "../BaseSetting";
import { ValueSetting } from "../ValueSetting";
import { SettingWidth } from "../settingWidth";
import { Button } from "../../button/Button";
import { FillStyle, Variant } from "../../../common/types/variants";
import { Icons } from "../../icons/Icons";
import { classNames } from "../../../common/helpers/classNames";
import { arrayMove } from "../../../common/helpers/arrayMove";
import { formatTracks, parseTracks, TRACK_UNITS, type Track, type TrackUnit } from "./cssTracks";

// A grid has to stay countable by eye; far past this it is a list, not a layout.
const MAX_TRACKS = 24;

/**
 * A CSS grid track list as one row per track. No tracks means the grid arranges its blocks by
 * itself, which is why the empty state is a stated mode rather than a blank.
 */
export function TrackSetting(props: InputSettingProps<string | undefined>): JSX.Element {
  // The schema's own pattern rejects anything unparseable, so a null here means hand-edited or
  // stale config; treat it as empty and let the field's validation error do the explaining.
  const tracks = parseTracks(props.value) ?? [];

  const write = (next: readonly Track[]): void => void props.setValue(formatTracks(next));

  const replace = (index: number, track: Track): void =>
    write(tracks.map((existing, i) => (i === index ? track : existing)));

  return (
    // A list of rows never fits the wide layout's single-line input area.
    <ValueSetting {...props} width={SettingWidth.COMPACT}>
      {({ changed }) => (
        <div className={classNames("trackEditor", changed && "changed")}>
          {tracks.length === 0 ? (
            <p className="trackAuto">Automatic: arranged to fit the blocks.</p>
          ) : (
            <ol className="trackList">
              {tracks.map((track, index) => (
                // Index keys: tracks have no identity of their own, and the whole list is
                // rewritten on every edit anyway.
                <li className="trackRow" key={index}>
                  <span className="trackIndex">{index + 1}</span>
                  <input
                    className="textfield trackSize"
                    type="number"
                    min={0}
                    step="any"
                    value={track.value ?? ""}
                    // `auto` sizes itself, so there is no number to give it.
                    disabled={props.disabled || track.unit === "auto"}
                    aria-label={`Track ${index + 1} size`}
                    onChange={(event) => {
                      const value = event.target.valueAsNumber;
                      replace(index, { ...track, value: Number.isNaN(value) ? undefined : value });
                    }}
                  />
                  <select
                    className="textfield trackUnit"
                    value={track.unit}
                    disabled={props.disabled}
                    aria-label={`Track ${index + 1} unit`}
                    onChange={(event) => {
                      const unit = event.target.value as TrackUnit;
                      // Coming back from `auto` needs a number again, or the track would format
                      // as 0 and collapse.
                      replace(index, { unit, value: unit === "auto" ? undefined : (track.value ?? 1) });
                    }}
                  >
                    {TRACK_UNITS.map((unit) => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                  <Button
                    fillStyle={FillStyle.SKELETON}
                    onClick={() => write(arrayMove(tracks, index, index - 1))}
                    disabled={props.disabled || index === 0}
                    ariaLabel="Move up"
                  >
                    <Icons.chevronUp size={14} />
                  </Button>
                  <Button
                    fillStyle={FillStyle.SKELETON}
                    onClick={() => write(arrayMove(tracks, index, index + 1))}
                    disabled={props.disabled || index === tracks.length - 1}
                    ariaLabel="Move down"
                  >
                    <Icons.chevronDown size={14} />
                  </Button>
                  <Button
                    fillStyle={FillStyle.SKELETON}
                    variant={Variant.DANGER}
                    onClick={() => write(tracks.filter((_, i) => i !== index))}
                    disabled={props.disabled}
                    ariaLabel="Remove track"
                  >
                    <Icons.delete size={14} />
                  </Button>
                </li>
              ))}
            </ol>
          )}

          <div className="trackActions">
            <Button
              fillStyle={FillStyle.FILLED}
              onClick={() => write([...tracks, { value: 1, unit: "fr" }])}
              disabled={props.disabled || tracks.length >= MAX_TRACKS}
              ariaLabel="Add track"
            >
              <Icons.add size={16} />
            </Button>
            {tracks.length > 0 && (
              <Button
                fillStyle={FillStyle.SKELETON}
                onClick={() => write([])}
                disabled={props.disabled}
              >
                <span>Back to automatic</span>
              </Button>
            )}
          </div>
        </div>
      )}
    </ValueSetting>
  );
}
