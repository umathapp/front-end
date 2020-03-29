import React, { PureComponent } from 'react';
import { View, Text, Image } from 'react-native';
import { Bar } from 'react-native-progress';
import {
  createStackNavigator,
  HeaderBackButton,
} from '@react-navigation/stack';
import { Button } from 'react-native-elements';

import ROUTES from '../../../../platform/constants/routes';
import SkillController from '../../../../platform/api/skill';
import TopicController from '../../../../platform/api/topic';
import AccountController from '../../../../platform/api/account';
import { navigationWrapper } from '../../../../platform/services/navigation';

import LocalStyles from './styles';
import Styles from '../../../../../assets/styles';
import Variables from '../../../../../assets/styles/variables';

class MyAccount extends PureComponent {
  static navigationOptions = ({ navigation }) => ({
    title: 'My Account',
    headerLeft: () => (
      <HeaderBackButton
        onPress={() => navigationWrapper.navigation.navigate(ROUTES.HOME)}
      />
    ),
  });

  state = {
    skill: {},
    topic: {},
    details: null,
    progress: { revision: 0, learning: 0 },
  };

  handleSkillClick = () =>
    this.state.skill.redirectToTopic
      ? this.handleTopicClick()
      : navigationWrapper.navigation.navigate(
          ROUTES.CONTENT_LEARNING_SKILL_ITEM,
          this.state.skill,
        );

  handleTopicClick = () =>
    navigationWrapper.navigation.navigate(
      ROUTES.CONTENT_LEARNING_SKILLS,
      this.state.topic,
    );

  getPercentage = num => Math.round(num * 100);

  BarItem = ({ percent }) => (
    <Bar
      width={120}
      height={12}
      borderWidth={0}
      borderRadius={0}
      progress={percent}
      color={Variables.lightBlue}
      style={LocalStyles.progressBar}
      unfilledColor={Variables.lightGray}
    />
  );

  async componentDidMount() {
    const {
      progress: { learning, revision },
    } = this.state;
    const result = await AccountController.Details();

    const {
      lastSkill: { skillId, topicId },
    } = result.recent;

    const [topics, skills] = await Promise.all([
      TopicController.List(1),
      SkillController.List(topicId),
    ]);

    const topic = topics.find(({ id }) => id === Number(topicId));

    const retrieveSkill = () => {
      const skillIndex = skills.findIndex(
        skill => skill.id === Number(skillId),
      );

      if (!skills[skillIndex].complete)
        return { ...skills[skillIndex], step: skillIndex + 1 };

      if (!skills[skillIndex + 1])
        return { ...skills[skillIndex], redirectToTopic: true };

      return { ...skills[skillIndex + 1], step: skillIndex + 2 };
    };

    const skill = retrieveSkill();

    this.setState({
      skill,
      topic,
      details: result?.user || null,
      progress: {
        revision: result?.revision || revision,
        learning: result?.learning || learning,
      },
    });
  }

  render() {
    const { details, topic, skill, progress } = this.state;

    return details ? (
      <View style={Styles.page}>
        <View style={Styles.card.classic}>
          <Image style={LocalStyles.profileImage} source={{}} />
          <Text style={LocalStyles.fullName}>
            {details.name} {details.surname}
          </Text>
          <View style={LocalStyles.progress}>
            <Button
              type="solid"
              key={skill.id}
              onPress={this.handleSkillClick}
              buttonStyle={LocalStyles.button}
              titleStyle={Styles.button.title}
              title={`${skill.name} ${skill.step}`}
            />
            <Button
              type="solid"
              key={topic.id}
              title={topic.name}
              onPress={this.handleTopicClick}
              buttonStyle={LocalStyles.button}
              titleStyle={Styles.button.title}
            />
          </View>
          <View style={LocalStyles.divider} />
          <Text style={Styles.text.normalSize}>Progress:</Text>
          <View style={LocalStyles.progressItem}>
            <Text style={Styles.text.smallSize}>Learning:</Text>
            <this.BarItem percent={progress.learning} />
            <Text style={Styles.text.smallSize}>
              {this.getPercentage(progress.learning)}%
            </Text>
          </View>
          <View style={LocalStyles.progressItem}>
            <Text style={Styles.text.smallSize}>Revision:</Text>
            <this.BarItem percent={progress.revision} />
            <Text style={Styles.text.smallSize}>
              {this.getPercentage(progress.revision)}%
            </Text>
          </View>
        </View>
      </View>
    ) : null;
  }
}

const Stack = createStackNavigator();

const MyAccountScreens = () => (
  <Stack.Navigator
    headerLayoutPreset="center"
    screenOptions={() => Styles.navigation}
    initialRouteName={ROUTES.CONTENT_MY_ACCOUNT}
  >
    <Stack.Screen name={ROUTES.CONTENT_MY_ACCOUNT}>
      {props => <MyAccount {...props} />}
    </Stack.Screen>
  </Stack.Navigator>
);

export default MyAccountScreens;
