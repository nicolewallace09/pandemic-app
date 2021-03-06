import React, { useState, useEffect } from 'react';
import { Jumbotron, Container, Form, Col, Button, Row } from 'react-bootstrap';
import GlobalCard from '../components/GlobalCard';
import CountryCard from '../components/CountryCard';
import StateCard from '../components/StateCard';
import { searchByState } from '../utils/API';
import TimelineCases from '../components/TimelineCases';
import TimelineDeaths from '../components/TimelineDeaths';
import { saveStateIds, getSavedStateIds } from '../utils/localStorage';
import { useMutation } from '@apollo/react-hooks';
import { SAVE_STATE } from '../utils/mutations';
import Auth from '../utils/auth';


const Homepage = () => {

    // create state for holding returned api data
    const [searchedUsState, setSearchedUsState] = useState([]);

    // create state for holding our search field data
    const [searchInput, setSearchInput] = useState(''); 

    // create state for holding state Ids
    const [holdStateId, setHoldStateId] = useState('');

    let stateData = {};

    // create state to hold saved stateID values
    const [savedStateIds, setSavedStateIds] = useState(getSavedStateIds()); 

    // save the state info 
    const [saveState, { error }] = useMutation(SAVE_STATE);  

    // set up useEffect hook to save 'saveStateIds' list to localStorage
    useEffect(() => {
    return () => saveStateIds(savedStateIds);
    });

  
    // set setSearchUsState back to original state after state search
    useEffect(() => {
        if (searchedUsState.length > 0) {
            return () => setSearchedUsState([])}
        })

    // create method to search for US States and set state on form submit
    const handleFormSubmit = async (event) => {
        event.preventDefault();

        if (!searchInput) {
            return false;
        }

        try {
            const response = await searchByState(searchInput.toLowerCase());
      
            if (!response.ok) {
                throw new Error('Something went wrong!');
            }

            const data = await response.json();
      
            stateData = {
                confirmed: data.Confirmed,
                deaths: data.Deaths,
                newConfirmed: data.NewConfirmed,
                newDeaths: data.NewDeaths,
                lastUpdate: data.Last_Update,
                name: searchInput.toLowerCase(),
                stateId: data.Slug_State
            };
      
            // set state with savedStateId
            setSavedStateIds([...savedStateIds, stateData.stateId]);
      
            // set state with stateId to be used in handleSaveSearch
            setHoldStateId(stateData.stateId);
      
            // clear out search form
            setSearchInput('');
            
            // retain the searched data, so it can be passed, as prop, to StateCard
            setSearchedUsState([...searchedUsState, stateData]);
            
            } catch (err) {
              console.error(err);
            }
      
    };


    // function to handle saving a state to the database
    const handleSaveState = async () => {
    
        // find the state in `savedStateIds` state by the matching id
        const stateId = savedStateIds.find((search) => search === holdStateId);
    
        // get token
        const token = Auth.loggedIn() ? Auth.getToken() : null;
    
        if (!token) {
            return false;
        }

        try {
            const { data } = await saveState({
            variables: { input: searchedUsState[0]}
        });

      
    

        if (error) {
            throw new Error('something went wrong!');
        }

        // if search successfuly saves to user's account, save state ID to state
        setSavedStateIds([...savedStateIds, holdStateId]);
   
        // setting back to empty string for next save
        setHoldStateId('')
    
        } catch (err) {
            console.error(err);
        }

    }
      
    return (
        <>
        <Jumbotron className='text-light bg-danger' style={{ width: '100%', height: 560, paddingTop: 200, paddingLeft: 100}}>
          <Container>
            <h5>Search for your state</h5>
            < Form onSubmit={handleFormSubmit}>
              <Form.Row>
                <Col xs={8} md={8}>
                  <Form.Control
                    name='searchInput'
                    value={searchInput.toLowerCase()}
                    onChange={(e) => setSearchInput(e.target.value)}
                    type='text'
                    size='md'
                    placeholder='Enter a state'
                  />
                  <i className="app-claim">* This application is intended for US states only</i>
                </Col>
                <Col xs={4} md={4}>
                  <Button type='submit' variant='danger' size='md'>
                    Search
                  </Button>
                </Col>
              </Form.Row>
            </Form>
          </Container>
        </Jumbotron>

        <Container fluid>
            <Row>
                <Col sm={12} md={12}>
                    { searchedUsState.length > 0 ? <StateCard value = {searchedUsState[0]}  /> : null }
                    {Auth.loggedIn() && searchedUsState.length > 0 && (
                        <Button onClick = {handleSaveState}>
                            Save    
                        </Button>
                    )}
                    
                </Col>
            </Row>
        </Container> 

        <Container>
          <center><img src="https://www.knightdesign.com.au/wp-content/uploads/2020/03/COVID-19.png" alt="covid-logo" style={{ height: 300, width: 650 }}></img></center>
        </Container>

        <Container fluid>
            <Row>
                <Col sm="12" md="12" lg="6">
                    <GlobalCard/>
                </Col>

                <Col sm="12" md="12" lg="6">
                    <CountryCard />
                </Col>
           </Row>
        </Container>

        <Container fluid className="time-series">
            <h1 className="time-header text-center">US Time Series (60 Day Trend)</h1><br></br>
            <Row style={{paddingLeft: 25, paddingBottom: 100}}>
              <Col sm="12" md="12" lg="6">
                <TimelineCases/>
              </Col>
              

              <Col sm="12" md="12" lg="6">
                <TimelineDeaths/>
              </Col>
            </Row>


    
            <Row>
                <Col sm="12" md='12'>
                    <center><img src="https://completemusicupdate.com/wp-content/uploads/2020/03/stopthespread1250.jpg" alt="stopspread" style={{paddingBottom: 100}}></img></center>
                </Col>
            </Row>
        </Container>
      </>
    );
};

export default Homepage;