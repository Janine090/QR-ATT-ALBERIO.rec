import Svg, {
  Defs,
  G,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';

export default function LogoMark({ size = 56 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <LinearGradient id="logoGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#22D3EE" />
          <Stop offset="1" stopColor="#8B5CF6" />
        </LinearGradient>
      </Defs>
      <Rect
        x="1.5"
        y="1.5"
        width="61"
        height="61"
        rx="18"
        fill="#0A1424"
        stroke="url(#logoGrad)"
        strokeWidth="2"
      />
      <G
        stroke="url(#logoGrad)"
        strokeWidth="3.2"
        strokeLinecap="round"
        fill="none"
      >
        <Path d="M16 25v-6a3 3 0 0 1 3-3h6" />
        <Path d="M48 25v-6a3 3 0 0 0-3-3h-6" />
        <Path d="M16 39v6a3 3 0 0 0 3 3h6" />
        <Path d="M48 39v6a3 3 0 0 1-3 3h-6" />
      </G>
      <Rect x="25" y="25" width="14" height="14" rx="4" fill="#22D3EE" />
      <Rect x="43" y="17" width="5" height="5" rx="1.5" fill="#8B5CF6" />
      <Rect x="17" y="43" width="5" height="5" rx="1.5" fill="#8B5CF6" />
      <Rect x="43" y="43" width="5" height="5" rx="1.5" fill="#22D3EE" opacity="0.75" />
    </Svg>
  );
}
