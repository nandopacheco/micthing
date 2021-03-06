import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { bpmSet, layerRemoveAll, microphoneRequest, playbackStart, playbackStop, recordingStart, recordingStop, swingSet, volumeSet } from '../actions';
import { BPM_MINIMUM, BPM_MAXIMUM, MICROPHONE_STATE, RECORDING_STATE } from '../constants';
import { useSprings } from './hooks/useSprings';
import { useTransition } from './hooks/useTransition';
import cn from '../utils/cn';
import Button from './Button';
import IconCheck from './IconCheck';
import IconWarning from './IconWarning';
import Layer from './Layer';
import LayersMatrix from './LayersMatrix';
import Range from './Range';
import VolumeMeter from './VolumeMeter';

function Overlay({ className = '', children }) {
  return (
    <div className="pa3 fixed absolute--fill bg-black-70 flex overflow-auto">
      <div className={`flex-auto flex-grow-0 ma-auto ${className}`}>
        {children}
      </div>
    </div>
  )
}

function NotSupportedOverlay({ isSupported, supportRequirements }) {
  if (isSupported) {
    return null;
  }

  return (
    <Overlay className="bg-red">
      <div className="ma5">
        <h1 className="f2 lh-title mt0">Sorry...</h1>
        <p className="f4 lh-copy mb4">
          Your browser doesn't support all the features we need.
        </p>
        {supportRequirements.map((requirement, index) => (
          <div
            key={index}
            className={cn(
              'mb4',
              requirement.isSupported ? 'o-60' : null
            )}
          >
            <h2 className="lh-title mt0">
              <span className="dib w2 h2 v-mid mr3">
                {requirement.isSupported ?
                  <IconCheck />
                  :
                  <IconWarning />
                }
              </span>
              <span className="v-mid">
                {requirement.title} is {!requirement.isSupported ? ' not ' : null} supported
              </span>
            </h2>
            <p>
              {requirement.description}
              {' '}
              <a className="color-inherit" target="_blank" rel="noopener noreferrer" href={requirement.link}>Find out more</a>.
            </p>
          </div>
        ))}
      </div>
    </Overlay>
  );
}

function MicrophoneMessage({ microphoneState, onMicrophoneRequest }) {
  switch (microphoneState) {
    case MICROPHONE_STATE.INIT:
    case MICROPHONE_STATE.REQUESTED_PERMISSION:
      return (
        <Overlay>
          <div className="ma5">
            <h1 className="f2 lh-title mt0">Hi.</h1>
            <p className="f4 lh-copy">Want to make music with sounds from your microphone?</p>
            <Button
              onClick={onMicrophoneRequest}
              disabled={microphoneState !== MICROPHONE_STATE.INIT}
            >
              Yes
            </Button>
          </div>
        </Overlay>
      );
    case MICROPHONE_STATE.DISABLED:
      return (
        <Overlay className="bg-red">
          <div className="ma5">
            <h1 className="f2 lh-title mt0">Sorry...</h1>
            <p className="f4 lh-copy">
              We can't access your microphone.
            </p>
          </div>
        </Overlay>
      );
    default:
      return null;
  }
}

function App(props) {
  const { bpm, isCapturing, isPlaying, isRecording, isSupported, layers, microphoneState, supportRequirements, swing, volume, webAudioIsSuspended } = props;
  const { onBpmSet, onLayerRemoveAll, onMicrophoneRequest, onPlaybackStart, onPlaybackStop, onRecordingStart, onRecordingStop, onSwingSet, onVolumeSet } = props;

  const { controlsRef, containerRef, updateSpringProps, getLayerSprings } = useSprings({
    onLayerRemoved: (key) => {
      removeLayer(key);
    }
  });

  const [layersWrapped, removeLayer] = useTransition(layers, {
    getKey: (layer) => layer.id,
    onUpdate: (child, state) => {
      const layerSprings = getLayerSprings(child.key);

      switch (state) {
        case 'enter':
          layerSprings.state = 'enter';
          break;
        case 'exit':
          layerSprings.state = 'exit';
          break;
        default:
      }
    }
  });

  useEffect(function () {
    updateSpringProps(layersWrapped, isCapturing);
  }, [layersWrapped, isCapturing]);

  return (
    <>
      <div className="ma5">
        <div className="mb3">
          <VolumeMeter>
            {webAudioIsSuspended ? 'Web Audio is waiting for your input...' : null}
          </VolumeMeter>
        </div>
        <div className="flex mb3">
          <Button
            disabled={microphoneState !== MICROPHONE_STATE.ENABLED}
            isDown={isRecording}
            onClick={isRecording ? onRecordingStop : onRecordingStart}
          >
            Record
          </Button>
        </div>
        <div ref={controlsRef} className="flex mb4">
          <Button
            isDown={isPlaying}
            onClick={isPlaying ? onPlaybackStop : onPlaybackStart}
          >
            Play
          </Button>
          <span className="w1 flex-none" />
          <Range
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={onVolumeSet}
          >
            Volume
          </Range>
          <span className="w1 flex-none" />
          <Range
            min={BPM_MINIMUM}
            max={BPM_MAXIMUM}
            step={1}
            value={bpm}
            onChange={onBpmSet}
          >
            BPM: {bpm}
          </Range>
          <span className="w1 flex-none" />
          <Range
            min={0}
            max={0.95}
            step={0.01}
            value={swing}
            onChange={onSwingSet}
          >
            Swing: {Math.floor(swing * 100)}%
          </Range>
          <span className="w1 flex-none" />
          <Button
            onClick={onLayerRemoveAll}
          >
            Clear
          </Button>
        </div>
        <p
          className="ma0 h2 absolute"
          style={{
            opacity: isCapturing ? '1' : '0',
            willChange: 'opacity'
          }}
        >
          ...
        </p>
        <div ref={containerRef} className="relative">
          {layersWrapped.map(layerWrapped => (
            <div
              key={layerWrapped.key}
              ref={getLayerSprings(layerWrapped.key).ref}
              className="absolute"
              style={{ willChange: 'opacity, transform, visibility' }}
            >
              <Layer layer={layerWrapped.item} />
            </div>
          ))}
        </div>
        <LayersMatrix layers={layers} />
      </div>
      <MicrophoneMessage microphoneState={microphoneState} onMicrophoneRequest={onMicrophoneRequest} />
      <NotSupportedOverlay isSupported={isSupported} supportRequirements={supportRequirements} />
    </>
  );
}

function mapStateToProps(state) {
  return {
    bpm: state.playback.bpm,
    isCapturing: state.recorder.recordingState === RECORDING_STATE.CAPTURING,
    isPlaying: state.playback.isPlaying,
    isRecording: state.recorder.recordingState !== RECORDING_STATE.OFF,
    isSupported: state.support.isSupported,
    layers: state.layers.list,
    microphoneState: state.microphone.state,
    supportRequirements: state.support.requirements,
    swing: state.playback.swing,
    volume: state.playback.volume,
    webAudioIsSuspended: state.webaudio.isSuspended
  };
}

export default connect(mapStateToProps, {
  onBpmSet: bpmSet,
  onLayerRemoveAll: layerRemoveAll,
  onMicrophoneRequest: microphoneRequest,
  onPlaybackStart: playbackStart,
  onPlaybackStop: playbackStop,
  onRecordingStart: recordingStart,
  onRecordingStop: recordingStop,
  onSwingSet: swingSet,
  onVolumeSet: volumeSet
})(App);
