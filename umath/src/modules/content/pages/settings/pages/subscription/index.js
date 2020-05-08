import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Dimensions,
  AsyncStorage,
  Alert,
  ActivityIndicator,
} from "react-native";

import { Button } from "react-native-elements";
import { StackActions } from "@react-navigation/native";
import * as InAppPurchases from "expo-in-app-purchases";

import PaymentCard from "../../../../../../components/payment_card";

import styles from "./styles";
import { navigationWrapper } from "../../../../../../platform/services/navigation";
import ROUTES from "../../../../../../platform/constants/routes";
import { useSubscriptionChangeListener } from "../../../../../../utils/hooks_util";
import { changeOrPurchase } from "../../../../../../platform/services/payments";
import Variables from "../../../../../../../assets/styles/variables";
import UserController from "../../../../../../platform/api/user";

const _products = {
  ios: ["umathapp01", "umathapp02", "umathapp03", "umathapp04"],
};

const _subscrciptions = {
  umathapp01: "Month",
  umathapp02: "3 Months",
  umathapp03: "6 Months",
  umathapp04: "Year",
};

const SubscriptionInfo = ({
  subscriptionData,
  activeItem,
  setActiveItem,
}) =>
  subscriptionData.map((cardItem) => (
    <PaymentCard
      key={cardItem.productId}
      title={cardItem.title}
      onPress={() => setActiveItem(cardItem.productId)}
      isSelected={cardItem.productId === activeItem}
      description={`${cardItem.price}/\n${_subscrciptions[cardItem.productId]}`}
    />
  ));

const SubscriptionScreen = (props) => {
  const window = Dimensions.get("window");

  const [activeItem, setActiveItem] = useState(null);
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [shouldScroll, setShouldScroll] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const subscriptionStatus = useSubscriptionChangeListener();

  const _getProducts = async () => {
    const products = await InAppPurchases.getProductsAsync(_products.ios);
    if (products.responseCode == InAppPurchases.IAPResponseCode.OK) {
      setSubscriptionData(products.results);
    } else {
      Alert.alert("Something went wrong while fetching subscription data");
    }
    setSubscriptionData(products.results);
  };

  const _onContentSizeChange = (_, contentHeight) => {
    /**
     * Check if the contentHeight + the height of navigation items
     * is bigger than the height of the visible window
     * to enable scrolling when needed
     */
    const _shouldScroll = contentHeight + 90 > window.height;

    setShouldScroll(_shouldScroll);
  };

  useEffect(() => {
    _getProducts();
  }, []);

  const _onSubmitPress = async () => {
    setLoading(true);

    const { oldSubscription } = props.route.params || {};
    const isLoggedIn = await AsyncStorage.getItem("token");

    await changeOrPurchase(activeItem, oldSubscription);

    if (isLoggedIn && isLoggedIn !== "")
      UserController.Edit({ isPremium: true });

    AsyncStorage.setItem("subscriptionId", activeItem);

    if (subscriptionStatus === InAppPurchases.IAPResponseCode.OK) {
      navigationWrapper.navigation.dispatch(
        StackActions.replace(ROUTES.CONTENT_SETTINGS_PAYMENT)
      );
    }

    setLoading(false);
  };

  return (
    <ScrollView
      scrollEnabled={shouldScroll}
      onContentSizeChange={_onContentSizeChange}
      contentContainerStyle={styles.scrollview_wrapper}
    >
      <View style={styles.content_wrapper}>
        <Text style={styles.text}>
          All the subscription plans are auto-renewable and give you access to
          the full learning in the app. Please choose the right length of
          subscription for you
        </Text>
        <Text style={styles.subtext}>
          (You will be charged immediately after you proceed with the purchase)
        </Text>
        <View style={styles.card_wrapper}>
          {subscriptionData == null ? (
            <View style={styles.activityIndicatorWrapper}>
              <ActivityIndicator size="large" color={Variables.blue} />
            </View>
          ) : (
              <SubscriptionInfo
                subscriptionData={subscriptionData}
                activeItem={activeItem}
                setActiveItem={setActiveItem}
              />
            )}
        </View>
        <Button
          onPress={activeItem == null ? null : _onSubmitPress}
          buttonStyle={styles.button}
          disabled={activeItem === null}
          loading={isLoading}
          title="Continue"
        />
      </View>
    </ScrollView>
  );
};

export default SubscriptionScreen;
