export const getDefaultResponseMessage = (last_update_time: Date | null): string => `
This demo page is powered by Deno, and deployed on the Deno Deploy Server with its free tier. All datasource pages those fetched by the demo were developed and maintained by other talented and warmhearted developers. I hereby would like to give them thumbs up and also contribute my respectful thanks to them. 

HINT: Remember to give this link a parameter 'id' to fetch a v2ray nodes file. 🙂

Kv database last updated at ${last_update_time? last_update_time.toLocaleString() : 'null'}, ${Intl.DateTimeFormat().resolvedOptions().timeZone}

Version: v2024.11.22
`;

export const getIncorrectIdMessage = (value: string | null): string => `
The value '${value}' seems incorrect. 😉
`;
