import { PrismaClient } from "@prisma/client";

import { Prisma } from "@calcom/prisma/client";

async function getBooking(prisma: PrismaClient, uid: string) {
  const booking = await prisma.booking.findFirst({
    where: {
      uid,
    },
    select: {
      startTime: true,
      description: true,
      attendees: {
        select: {
          email: true,
          name: true,
        },
      },
    },
  });

  if (booking) {
    // @NOTE: had to do this because Server side cant return [Object objects]
    // probably fixable with json.stringify -> json.parse
    booking["startTime"] = (booking?.startTime as Date)?.toISOString() as unknown as Date;
  }

  return booking;
}

export type GetBookingType = Prisma.PromiseReturnType<typeof getBooking>;

export default getBooking;
