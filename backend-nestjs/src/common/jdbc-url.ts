type JdbcParts = {
  host: string;
  port: number;
  database: string;
};

export const parseJdbcUrl = (jdbcUrl: string): JdbcParts | null => {
  const match = jdbcUrl.match(/^jdbc:postgresql:\/\/([^:/]+)(?::(\d+))?\/(.+)$/i);
  if (!match) {
    return null;
  }
  const host = match[1];
  const port = match[2] ? Number(match[2]) : 5432;
  const database = match[3];
  return { host, port, database };
};
