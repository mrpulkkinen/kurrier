import {ProviderSpec} from "@schema";
import {getProviderSecrets, SyncProvidersRow} from "@/lib/actions/dashboard";
import ProviderCard from "@/components/dashboard/providers/provider-card";


type Props = {
    userProviders: SyncProvidersRow[]
    spec: ProviderSpec;
};

export default async function ProviderCardShell({ userProviders, spec }: Props) {

    const userProvider = userProviders.find(p => p.providers.type === spec.key);

    const secrets = userProvider
        ? await getProviderSecrets(userProvider.providers.id)
        : [];

    if (userProvider){
        return <ProviderCard spec={spec} userProvider={userProvider} secrets={secrets} />;
    } else {
        return <div>No Providers Found</div>
    }

}
