import {Composition} from 'remotion';
import {DesafioTeleton, TOTAL} from './DesafioTeleton';
import {DesafioHorizontal, TOTAL_H} from './DesafioHorizontal';
import {DesafioUSS, TOTAL_USS} from './DesafioUSS';

export const Root: React.FC = () => (
  <>
    <Composition
      id="DesafioTeleton"
      component={DesafioTeleton}
      durationInFrames={TOTAL}
      fps={30}
      width={1080}
      height={1920}
    />
    <Composition
      id="DesafioHorizontal"
      component={DesafioHorizontal}
      durationInFrames={TOTAL_H}
      fps={30}
      width={1920}
      height={1080}
    />
    <Composition
      id="DesafioUSS"
      component={DesafioUSS}
      durationInFrames={TOTAL_USS}
      fps={30}
      width={1920}
      height={1080}
    />
  </>
);
