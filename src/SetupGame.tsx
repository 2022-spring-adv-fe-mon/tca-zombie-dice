import { PrimaryButton, DefaultButton } from '@fluentui/react/lib/Button';
import { DefaultPalette, Stack, Icon, Checkbox } from '@fluentui/react';
import { useNavigate } from 'react-router-dom';
import { buttonStyles, buttonTextStyles, cardStyles } from './App';
import { Text } from '@fluentui/react/lib/Text';
import { useState } from 'react';
import { DocumentCard } from '@fluentui/react';

interface SetupGameProps {
    uniquePlayers: string[];
    darkTheme: boolean;
}

export const SetupGame: React.FC<SetupGameProps> = ({uniquePlayers, darkTheme = false}) => {

    const nav = useNavigate();

    const [santaChosen, setSantaChosen] = useState(false);
    const [hunkHottieChosen, setHunkHottieChosen] = useState(false);

    const sortedPlayers =  [...uniquePlayers].sort();

    return (
        <Stack style={{padding: 30}} tokens={{childrenGap: 10}}>
            <Stack horizontal tokens={{childrenGap: 10}}>
                <Text variant="xLarge">
                    Choose Expansions
                </Text>
                <Text variant="medium" styles={{ root: { marginTop: 5}}}>
                    (tap to use)
                </Text>
            </Stack>
            <DefaultButton
                styles={buttonStyles}
                primary={santaChosen}
                onClick={() => setSantaChosen(!santaChosen)}
            >
                <Stack>
                    <Text 
                        variant='xLarge'
                        styles={{ root: {
                                color: darkTheme ? "#fefefd" : santaChosen ? DefaultPalette.white : "#0f0c35"
                            }
                        }} 
                    >
                        Santa
                    </Text>
                    {santaChosen && 
                        <Text variant='medium' styles={{root: { color: DefaultPalette.white}}}>
                            Swap with standard &nbsp;<span style={{color: "darkgreen", backgroundColor: 'white', paddingLeft: 4, paddingRight: 4, paddingBottom: 3, marginTop: -2, fontWeight: "bold"}}>green</span>
                        </Text>
                    }                 
                </Stack>
            </DefaultButton>

            <DefaultButton
                styles={buttonStyles}
                primary={hunkHottieChosen}
                onClick={() => setHunkHottieChosen(!hunkHottieChosen)}
            >
                <Stack>
                    <Text 
                        variant='xLarge' 
                        styles={{ root: {
                            color: darkTheme ? "#fefefd" : hunkHottieChosen ? DefaultPalette.white : "#0f0c35"
                        }
                    }}                         
                    >
                        Hunk &amp; Hottie
                    </Text>
                    {hunkHottieChosen && 
                        <Text variant='medium' styles={{root: { color: DefaultPalette.white}}}>
                            Swap with 2 standard &nbsp;<span style={{color: "gold", backgroundColor: 'white', paddingLeft: 4, paddingRight: 4, paddingBottom: 3, marginTop: -2, fontWeight: "bold"}}>yellow</span>
                        </Text>
                    }                 
                </Stack>
            </DefaultButton>

            <Stack horizontal tokens={{childrenGap: 10}}>
                <Text variant="xLarge">
                    Choose Players
                </Text>
                <Text variant="medium" styles={{ root: { marginTop: 5}}}>
                    (player order on next screen)
                </Text>
            </Stack>

            {sortedPlayers.map(x => (
                <Checkbox 
                    key={x} 
                    label={x}
                />
            ))}

            <PrimaryButton
                styles={buttonStyles}
                onClick={() => nav("/play")}
                style={{ marginTop: 50}}
            >
                <Text variant='xLarge' styles={buttonTextStyles}>
                    Start Playing
                </Text>
            </PrimaryButton>
        </Stack>

    );
};