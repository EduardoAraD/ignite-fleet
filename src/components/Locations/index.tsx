import { Car, FlagCheckered } from 'phosphor-react-native';

import { LocationInfo, LocationInfoProps } from '../LocationInfo';

import { Container, Line } from './styles';

type Props = {
  departure: LocationInfoProps,
  arrival?: LocationInfoProps | null,
}

export function Locations({ arrival = null, departure }: Props) {
  return (
    <Container>
      <LocationInfo
        icon={Car}
        description={departure.description}
        label={departure.label}
      />
      {arrival && (
        <>
          <Line />
          <LocationInfo
            description={arrival.description}
            icon={FlagCheckered}
            label={arrival.label}
          />
        </>
      )}
    </Container>
  );
}
