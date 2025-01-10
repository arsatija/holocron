"use server"

import { revalidateTag, unstable_noStore } from "next/cache"
import { db } from "@/db/index"
import { troopers, type Trooper } from "@/db/schema"
import { takeFirstOrThrow } from "@/db/utils"
import { asc, eq, inArray, not } from "drizzle-orm"
import { customAlphabet } from "nanoid"

import { getErrorMessage } from "@/lib/handle-error"

