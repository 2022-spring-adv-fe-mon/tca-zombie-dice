import { useNavigate } from 'react-router-dom';
import { DefaultButton, PrimaryButton, CompoundButton } from '@fluentui/react/lib/Button';
import { Text } from '@fluentui/react/lib/Text';
import { Stack, StackItem } from '@fluentui/react/lib/Stack';
import { CommandBar, Icon } from '@fluentui/react';
import {
    DocumentCard,
    DocumentCardActivity,
    DocumentCardTitle,
    DocumentCardLogo,
    DocumentCardStatus,
    IDocumentCardLogoProps,
    IDocumentCardActivityPerson,
    IDocumentCardStyles,
  } from '@fluentui/react/lib/DocumentCard';
import { DefaultPalette } from '@fluentui/theme';
import { GameResult, buttonStyles, buttonTextStyles, cardStyles } from "./App";
import { DetailsList, DetailsListLayoutMode, Selection, IColumn, SelectionMode } from '@fluentui/react/lib/DetailsList';
import pms from 'pretty-ms';
import { Panel, PanelType } from '@fluentui/react/lib/Panel';
import { useEffect, useState } from 'react';
import { TextField } from '@fluentui/react/lib/TextField';

interface HomeProps {
    gameResults: GameResult[];
    darkMode: boolean;
    setDarkMode: any;
    uniquePlayers: string[];
    saveAtOwnRisk: (json: string) => void
    email: string;
    saveNewEmail: (e: string) => void;
    emailLoaded: boolean;
    gamesLoaded: boolean;
    loading: boolean;
};

const stackItemStyles = { 
    root: { 
        display: 'flex'
        , justifyContent: 'center' 
    }
};

const calculateLeaderBoard = (p: string[], r: GameResult[]) => {

    const lb = p.map(x => {
  
      const gamesThisPlayerHasPlayed = r.filter(y => y.players.length > 1 && y.players.some(z => z.name === x));
      const gamesThisPlayerHasWon = gamesThisPlayerHasPlayed.filter(y => y.winner === x);
  
      return {
        name: x
        , wins: gamesThisPlayerHasWon.length
        , losses: gamesThisPlayerHasPlayed.length - gamesThisPlayerHasWon.length
        , average: (gamesThisPlayerHasWon.length / gamesThisPlayerHasPlayed.length).toFixed(3)
      };
    });
  
    console.log("calculateLeaderBoard", lb);
  
    return lb
        .filter(x => x.wins + x.losses > 0)
        .sort((a, b) => `${b.average}${b.wins + b.losses}`.localeCompare(`${a.average}${a.wins + a.losses}`));
};

const calculateFewestTurnWins = (p: string[], r: GameResult[]) => {

    const data = p
        .reduce(
            (acc: {name: string, fewestTurns: number}[], x) => {

                const gamesThisPlayerHasPlayed = r.filter(y => y.players.some(z => z.name === x));
                const soloGamesThisPlayerHasWon = gamesThisPlayerHasPlayed.filter(y => y.players.length === 1 && y.winner === x);
                const gamesThisPlayerHasWon = gamesThisPlayerHasPlayed.filter(y => y.players.length > 1 && y.winner === x);
            
                const soloMinTurns = Math.min(...soloGamesThisPlayerHasWon.flatMap(y => y.players.map(z => z.turns?.length)));
                const competitiveMinTurns: number = Math.min(...gamesThisPlayerHasWon.flatMap(y => y.players.map(z => z.turns?.length)));
    
                return [
                    ...acc
                    , ...(
                        competitiveMinTurns > 0 
                            ? [
                                {
                                    name: x
                                    , fewestTurns: competitiveMinTurns
                                }
                            ]
                            : []
                    )
                    , ...(
                        soloGamesThisPlayerHasWon.length > 0 
                            ? [
                                {
                                    name: `${x} (solo)`
                                    , fewestTurns: soloMinTurns
                                }
                            ]
                            : []
                    )
                ];
            }
            , []
        );
  
    return data
        .sort((a, b) => a.fewestTurns > b.fewestTurns ? 1 : -1)
        .map(x => ({
            ...x
            , fewestTurns: isFinite(x.fewestTurns) ? x.fewestTurns.toString() : "n/a"
        }))
    ;
};

const calculateMostSingleTurnBrains = (p: string[], r: GameResult[]) => {

    const data = p.reduce(
        (acc: {name: string, maxBrains: number}[], x) => {
        
            const soloGamesThisPlayerHasPlayed = r.filter(y => y.players.length === 1 && y.players.some(z => z.name === x));
            const competitiveGamesThisPlayerHasPlayed = r.filter(y => y.players.length > 1 && y.players.some(z => z.name === x));
        
            const soloMax = Math.max(...soloGamesThisPlayerHasPlayed.flatMap(y => y.players.flatMap(z => z.turns)));
            const competitiveMax = Math.max(...competitiveGamesThisPlayerHasPlayed.flatMap(y => y.players.flatMap(z => z.turns)));
            
            return [
                ...acc
                , ...(
                    competitiveMax > 0 
                        ? [
                            {
                                name: x
                                , maxBrains: competitiveMax
                            }
                        ]
                        : []
                )
                , ...(
                    soloGamesThisPlayerHasPlayed.length > 0 
                        ? [
                            {
                                name: `${x} (solo)`
                                , maxBrains: soloMax
                            }
                        ]
                        : []
                )
            ];
        }
        , []
    );
  
    return data.sort((a, b) => a.maxBrains < b.maxBrains ? 1 : -1);
};

const calculateExpansionsPlayed = (r: GameResult[]) => {

    const groupedByCombinedExpansionString = r.reduce(
        (acc, x) => acc.set(
            x.expansions.join(", ")
            , acc.has(x.expansions?.join(", ")) ? [...acc.get(x.expansions.join(", ")) ?? [], x] : [x]
        )
        , new Map<string, GameResult[]>()
    );

    return [...groupedByCombinedExpansionString].map(x => ({
        expansions: x[0].length === 0 ? "Base Game Only" : x[0]
        , count: x[1].length
    })).sort((a, b) => a.count > b.count ? -1 : 1);
};

const calculateGameTimes = (r: GameResult[]) => {

    const groupedByNumberOfPlayers = r.reduce(
        (acc, x) => acc.set(
            x.players.length
            , acc.has(x.players.length) ? [...acc.get(x.players.length) ?? [], x] : [x]
        )
        , new Map<number, GameResult[]>()
    );

    return [...groupedByNumberOfPlayers].map(x => { 
        return ({
            players: x[0]
            , count: x[1].length
            , averageMs: x[1]
                .map(x => Date.parse(x.end) - Date.parse(x.start))
                .reduce(
                    (acc, x) => acc + x
                    , 0
                ) / x[1].length
        })
    }).map(x => ({
        ...x 
        , averageMs: pms(x.averageMs, {secondsDecimalDigits: 0})
    })).sort((a, b) => a.players < b.players ? -1 : 1);
};

export const Home: React.FC<HomeProps> = ({
    gameResults
    , darkMode
    , setDarkMode
    , uniquePlayers
    , saveAtOwnRisk
    , email
    , saveNewEmail
    , emailLoaded
    , gamesLoaded
    , loading
}) => {

    const nav = useNavigate();

    const [changingEmail, setChangingEmail] = useState(email.length === 0);

    const [editedEmail, setEditedEmail] = useState("");

    const updateEmail = () => {
        if (editedEmail.length === 0) {
            return;
        }
        saveNewEmail(editedEmail);
        setChangingEmail(false);
    };

    const [jsonGameResults, setJsonGameResults] = useState("");

    console.log(jsonGameResults);

    useEffect(
        () => {
            // setJsonGameResults(JSON.stringify(gameResults, null, 4));
            setChangingEmail(email.length === 0);
            setEditedEmail(email);
        }
        , [email]
    );

    const lastGame = Math.max(...gameResults.map(x => Date.parse((x as any).end)));
    const msAgo = Date.now() - lastGame;    
    const lastPlayedDisplay = 
        isFinite(msAgo) 
            ? `${pms(msAgo, {secondsDecimalDigits: 0})} ago`
            : 'Never'


    const leaderboardData = calculateLeaderBoard(
        uniquePlayers 
        , gameResults
    );

    const mostSingleTurnBrainsData = calculateMostSingleTurnBrains(uniquePlayers, gameResults);

    const fewestTurnData = calculateFewestTurnWins(
        uniquePlayers 
        , gameResults
    );

    const expansionsData = calculateExpansionsPlayed(gameResults);
    const gameTimeData = calculateGameTimes(gameResults);

    return (

        loading ? 
        <Stack
            tokens={{
                padding: 10
                , childrenGap: 10
            }}
        >
        <Stack.Item
                align='stretch'
                styles={stackItemStyles}
            >
                <DocumentCard
                    styles={cardStyles}
                >

                    <Stack tokens={{ childrenGap: 10}}>
                        <Text
                            variant="xLarge"
                        >
                            Loading...
                        </Text>
                    </Stack>


                </DocumentCard>
            </Stack.Item>
        </Stack>
        :
        <Stack
            tokens={{
                padding: 10
                , childrenGap: 10
            }}
        >
            <Stack.Item
                align='stretch'
                styles={stackItemStyles}
            >
                <PrimaryButton
                    // onMenuClick={(e) => console.log(e)}
                    // split
                    // menuProps={{ items: [
                    //     {
                    //         key: "theme"
                    //         , text: darkMode ? "Light Mode" : "Dark Mode"
                    //         , onClick: () => setDarkMode(!darkMode)
                    //     }
                    // ]}}
                    onClick={() => nav("/setup")}
                    styles={buttonStyles}
                >
                    <Stack>
                        <Text
                            variant='xxLarge'
                            styles={buttonTextStyles}
                        >
                            Play Zombie Dice
                        </Text>
                        <Text 
                            variant="medium"
                            styles={buttonTextStyles}
                        >
                            And track your stats...
                        </Text>
                    </Stack>
                </PrimaryButton>
            </Stack.Item>

            <Stack.Item
                align='stretch'
                styles={stackItemStyles}
            >
                <DocumentCard
                    styles={cardStyles}
                >

                    <Stack tokens={{ childrenGap: 10}}>
                        <Text variant="large">Last Played</Text>
                        <Text
                            variant="xxLarge"
                        >
                            {lastPlayedDisplay}
                        </Text>
                    </Stack>


                </DocumentCard>
            </Stack.Item>

            {/* <Stack.Item
                align='stretch'
                styles={stackItemStyles}
            >
                <DocumentCard
                    styles={cardStyles}
                >
                    <Stack
                        horizontal
                    >
                        <Stack tokens={{ childrenGap: 10}}>
                            <Text variant="large">Time Played</Text>
                            <Text variant="xxLarge">0h 27m 03s</Text>
                        </Stack>
                    </Stack>
                </DocumentCard>
            </Stack.Item> */}

            <Stack.Item
                align='stretch'
                styles={stackItemStyles}
            >
                <DocumentCard
                    styles={cardStyles}
                >
                    <Stack tokens={{ childrenGap: 10}}>
                        <Text variant="large">Total Games Played</Text>
                        <Stack
                            horizontal
                            tokens={{ }}
                        >
                            <Text
                                variant="mega"
                            >
                                {gameResults.filter(x => x.players.length > 1).length}
                            </Text>
                            {gameResults.filter(x => x.players.length === 1).length > 0 &&
                                <Stack.Item
                                    align="end"
                                    styles={{root: {
                                        paddingLeft: 10
                                        , paddingBottom: 13
                                    }}}
                                >
                                    <Text
                                        variant="large"
                                    >
                                        {`competitive, and ${gameResults.filter(x => x.players.length === 1).length} solo`}
                                    </Text>
                                </Stack.Item>
                            }
                        </Stack>
                    </Stack>
                </DocumentCard>
            </Stack.Item>

            <Stack.Item
                align='stretch'
                styles={stackItemStyles}
            >
                <DocumentCard
                    styles={cardStyles}
                >
                    <Text variant="large">Leaderboard</Text>
                    {
                        leaderboardData.length === 0 ?
                        <p>
                            <Text variant='medium'>
                                Play some games with friends ! ! !
                            </Text>
                        </p> :
                        <DetailsList
                            compact={true}
                            selectionMode={SelectionMode.none}
                            items={leaderboardData}
                            layoutMode={DetailsListLayoutMode.justified}
                            columns={[
                                {key: 'wins', name: 'W', fieldName: 'wins', minWidth: 30, maxWidth: 30}
                                , {key: 'losses', name: 'L', fieldName: 'losses', minWidth: 30, maxWidth: 30}
                                , {key: 'avg', name: 'AVG', fieldName: 'average', minWidth: 50, maxWidth: 50}
                                , {key: 'name', name: '', fieldName: 'name', minWidth: 90}
                            ]}
                        />
                    }
                </DocumentCard>
            </Stack.Item>

            <Stack.Item
                align='stretch'
                styles={stackItemStyles}
            >
                <DocumentCard
                    styles={cardStyles}
                >
                    <Stack
                        tokens={{childrenGap: 15}}
                    >
                        <DefaultButton
                            styles={buttonStyles}
                            onClick={() => setDarkMode(!darkMode)}
                        >
                            <Text variant='large'>
                                Try {darkMode ? "Light" : "Dark"} Mode
                            </Text>
                        </DefaultButton>                
                        <DefaultButton
                            styles={buttonStyles}
                            onClick={() => setChangingEmail(true)}
                        >
                            <Stack>
                                <Text variant='large'>
                                    Change Email
                                </Text>
                                <Text variant='medium'>
                                    {
                                        email.length === 0 ? "Not Set" : email
                                    }
                                </Text>
                            </Stack>
                        </DefaultButton>                
                    </Stack>
                </DocumentCard>
            </Stack.Item>

            <Stack.Item
                align='stretch'
                styles={stackItemStyles}
            >
                <DocumentCard
                    styles={cardStyles}
                >
                    <Text variant="large">Most Brains (Single Turn)</Text>
                    {
                        mostSingleTurnBrainsData.length === 0 ?
                        <p>
                            <Text variant='medium'>
                                Eat some brainnns ! ! !
                            </Text>
                        </p> :
                        <DetailsList
                            compact={true}
                            selectionMode={SelectionMode.none}
                            items={mostSingleTurnBrainsData}
                            layoutMode={DetailsListLayoutMode.justified}
                            columns={[
                                {key: 'brains', name: 'Brains', fieldName: 'maxBrains', minWidth: 50, maxWidth: 50}
                                , {key: 'name', name: '', fieldName: 'name', minWidth: 90}
                            ]}
                        />
                    }
                    
                </DocumentCard>
            </Stack.Item>

            <Stack.Item
                align='stretch'
                styles={stackItemStyles}
            >
                <DocumentCard
                    styles={cardStyles}
                >
                    <Text variant="large">Fewest Turn Wins</Text>
                    {
                        fewestTurnData.length === 0 ?
                        <p>
                            <Text variant='medium'>
                                Try a solo game ! ! !
                            </Text>
                        </p> :                    
                        <DetailsList
                            compact={true}
                            selectionMode={SelectionMode.none}
                            items={fewestTurnData}
                            layoutMode={DetailsListLayoutMode.justified}
                            columns={[
                                {key: 'turns', name: 'Turns', fieldName: 'fewestTurns', minWidth: 50, maxWidth: 50}
                                , {key: 'name', name: '', fieldName: 'name', minWidth: 90}
                            ]}
                        />
                    }
                </DocumentCard>
            </Stack.Item>

            <Stack.Item
                align='stretch'
                styles={stackItemStyles}
            >
                <DocumentCard
                    styles={cardStyles}
                >
                    <Text variant="large">Expansions Played</Text>
                    {
                        expansionsData.length === 0 ?
                        <p>
                            <Text variant='medium'>
                                You guessed it, play ZD ! ! !
                            </Text>
                        </p> :
                        <DetailsList
                            compact={true}
                            selectionMode={SelectionMode.none}
                            items={expansionsData}
                            layoutMode={DetailsListLayoutMode.justified}
                            columns={[
                                {key: 'expansions', name: 'Expansions', fieldName: 'expansions', minWidth: 90}
                                , {key: 'count', name: 'Games', fieldName: 'count', minWidth: 50, maxWidth: 50}
                            ]}
                        />
                    }
                </DocumentCard>
            </Stack.Item>

            <Stack.Item
                align='stretch'
                styles={stackItemStyles}
            >
                <DocumentCard
                    styles={cardStyles}
                >
                    <Text variant="large">Game Times</Text>
                    {
                        gameTimeData.length === 0 ?
                        <p>
                            <Text variant='medium'>
                                No games, no times : - O
                            </Text>
                        </p> :
                        <DetailsList
                            compact={true}
                            selectionMode={SelectionMode.none}
                            items={gameTimeData}
                            layoutMode={DetailsListLayoutMode.justified}
                            columns={[
                                {key: 'players', name: 'Players', fieldName: 'players', minWidth: 50, maxWidth: 50}
                                , {key: 'count', name: 'Games', fieldName: 'count', minWidth: 50, maxWidth: 50}
                                , {key: 'length', name: 'Length (avg)', fieldName: 'averageMs', minWidth: 90, maxWidth: 90}
                            ]}
                        />
                        }
                </DocumentCard>
            </Stack.Item>

            <Panel
                type={PanelType.smallFixedNear}
                hasCloseButton={false}
                isOpen={emailLoaded && changingEmail}
                headerText={"Change Email"}
            >
                <Stack
                    tokens={{ childrenGap: 30 }}
                    styles={{ root: { marginTop: 40 } }}
                >
                    <TextField
                        value={editedEmail}
                        onChange={(e: any) => setEditedEmail(e.target.value)}
                    >
                    </TextField>
                    <Stack 
                        horizontal
                        tokens={{childrenGap: 10}}
                    >
                        <DefaultButton
                            onClick={updateEmail}
                        >
                            Save
                        </DefaultButton>
                        {email.length > 0 && <DefaultButton
                            onClick={() => setChangingEmail(false)}
                        >
                            Cancel
                        </DefaultButton>}
                    </Stack>
                    {/* <TextField 
                        label="Game Results JSON" 
                        multiline 
                        autoAdjustHeight
                        value={jsonGameResults}
                        onChange={(e: any) => setJsonGameResults(e.target.value)} 
                    />
                    <DefaultButton
                        onClick={() => {
                            setChangingEmail(false);
                            saveAtOwnRisk(jsonGameResults);
                        }}
                    >
                        Save at your own risk
                    </DefaultButton> */}
               </Stack>
            </Panel>
        </Stack>
    );
}