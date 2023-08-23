import { TouchableOpacityProps } from 'react-native';
import { useTheme } from 'styled-components/native';

import { IconBoxProps } from '../IconBox';

import { Container } from './styles';

type Props = TouchableOpacityProps & {
  icon: IconBoxProps;
}

export function ButtonIcon({ icon: Icon, ...rest}: Props) {
  const { COLORS } = useTheme();

  return (
    <Container activeOpacity={0.7} {...rest}>
      <Icon
        size={24}
        color={COLORS.BRAND_MID}
      />
    </Container>
  );
}
