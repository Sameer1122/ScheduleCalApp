import { Booking } from "@prisma/client";
import dayjs from "dayjs";
import { Modal, Blocks, Elements, Bits, Message } from "slack-block-builder";

import { BASE_URL } from "@calcom/lib/constants";

const TodayMessage = (bookings: Booking[]) => {
  if (bookings.length === 0) {
    return Message()
      .blocks(Blocks.Section({ text: "You do not have any bookings for today." }))
      .asUser()
      .buildToJSON();
  }
  return Message()
    .blocks(
      Blocks.Section({ text: `Todays Bookings.` }),
      Blocks.Divider(),
      bookings.map((booking) =>
        Blocks.Section({
          text: `${booking.title} | ${dayjs(booking.startTime).format("HH:mm")}`,
        }).accessory(Elements.Button({ text: "Cancel", url: `${BASE_URL}/cancel/${booking.uid}` }))
      )
    )
    .buildToObject();
};

export default TodayMessage;
